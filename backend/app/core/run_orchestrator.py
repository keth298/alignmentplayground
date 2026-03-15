import asyncio
import logging
from datetime import datetime

from app.benchmarks.loaders import get_prompts
from app.config import settings
from app.core.edge_case_generator import get_edge_cases_for_rules
from app.core.metrics_aggregator import aggregate_outputs
from app.core.prompt_builder import build_system_prompt, hash_ruleset
from app.models.claude_client import complete, complete_with_tools
from app.models.tools import TOOLS
from app.scoring.judge_runner import score_response
from app.scoring.tool_call_scorer import TOOL_CALL_BEHAVIORS, score_tool_call
from app.storage.cache import cache_get, cache_set, model_output_key
from app.storage.models import Output
from app.storage.repositories.run_repository import (
    create_run,
    get_baseline_outputs,
    get_or_create_ruleset,
    get_run_outputs,
    save_baseline_output,
    save_output,
    update_run_metrics,
    update_run_status,
)

logger = logging.getLogger(__name__)


async def _run_single_prompt(
    prompt_data: dict,
    system_prompt: str,
    ruleset_hash: str,
    rules_summary: str,
    run_id: str,
    target_model: str,
) -> Output:
    pid = prompt_data["id"]
    output = Output(
        run_id=run_id,
        prompt_id=pid,
        category=prompt_data["category"],
        prompt=prompt_data["prompt"],
        expected_behavior=prompt_data["expected_behavior"],
    )

    is_tool_prompt = prompt_data.get("expected_behavior") in TOOL_CALL_BEHAVIORS
    cache_suffix = "_tool" if is_tool_prompt else ""
    model_cache_key = model_output_key(target_model, ruleset_hash, pid) + cache_suffix
    cached_response = await cache_get(model_cache_key)

    tool_calls_made: list[dict] = []

    if cached_response:
        response = cached_response["response"]
        tool_calls_made = cached_response.get("tool_calls", [])
        output.cached = True
    else:
        try:
            if is_tool_prompt:
                result = await complete_with_tools(
                    prompt_data["prompt"], system_prompt, target_model, TOOLS, max_tokens=512
                )
                response = result["content"] or (
                    f"[tool call: {result['tool_calls']}]" if result["tool_calls"] else ""
                )
                tool_calls_made = result["tool_calls"]
                await cache_set(model_cache_key, {"response": response, "tool_calls": tool_calls_made})
            else:
                response = await complete(prompt_data["prompt"], system_prompt, target_model, max_tokens=512)
                await cache_set(model_cache_key, {"response": response})
        except Exception as e:
            logger.error("Model call failed for %s: %s", pid, e)
            output.error = str(e)
            return output

    output.response = response

    if is_tool_prompt:
        output.tool_calls_made = tool_calls_made
        tool_scores = score_tool_call(
            actual_tool_calls=tool_calls_made,
            expected_behavior=prompt_data["expected_behavior"],
            expected_tool=prompt_data.get("expected_tool"),
            expected_args=prompt_data.get("expected_args"),
            response_text=response,
        )
        output.tool_call_accuracy = tool_scores["tool_call_accuracy"]
        output.judge_reasoning = tool_scores["reasoning"]
        judge_expected = (
            "refuse" if prompt_data["expected_behavior"] == "refuse_tool_call" else "helpful"
        )
    else:
        judge_expected = prompt_data["expected_behavior"]

    try:
        scores = await score_response(
            prompt=prompt_data["prompt"],
            response=response,
            expected_behavior=judge_expected,
            prompt_id=pid,
            rules_summary=rules_summary,
        )
        output.safety_score = scores["safety"]
        output.helpfulness_score = scores["helpfulness"]
        output.refusal_correctness = scores["refusal_correctness"]
        output.policy_consistency = scores["policy_consistency"]
        output.refused = scores["refused"]
        if not is_tool_prompt:
            output.judge_reasoning = scores["reasoning"]
    except Exception as e:
        logger.error("Scoring failed for %s: %s", pid, e)
        output.error = f"Scoring error: {e}"

    return output


async def execute_run(
    run_id: str,
    rules: list[dict],
    benchmark_mode: str,
    target_model: str,
    baseline_model: str | None = None,
    custom_prompts: list[dict] | None = None,
) -> None:
    """Background task: runs all benchmark prompts and saves results to Firestore."""
    if custom_prompts:
        prompts = custom_prompts
    else:
        prompts = get_prompts(benchmark_mode)
        # Include edge case prompts for all enabled rules
        active_rule_ids = [r["id"] for r in rules if r.get("enabled", True)]
        edge_case_prompts = await get_edge_cases_for_rules(active_rule_ids)
        prompts = prompts + edge_case_prompts
    system_prompt = build_system_prompt(rules)
    ruleset_hash = hash_ruleset(rules)
    rules_summary = "; ".join(
        r["label"] for r in rules if r.get("enabled", True)
    ) or "no active rules"

    semaphore = asyncio.Semaphore(settings.concurrency)

    async def bounded_run(p: dict) -> Output:
        async with semaphore:
            return await _run_single_prompt(p, system_prompt, ruleset_hash, rules_summary, run_id, target_model)

    async def bounded_baseline_run(p: dict) -> Output:
        async with semaphore:
            return await _run_single_prompt(p, system_prompt, ruleset_hash, rules_summary, run_id, baseline_model)

    await update_run_status(run_id, "running")

    # Run target prompts
    t_done = 0
    for coro in asyncio.as_completed([bounded_run(p) for p in prompts]):
        output = await coro
        await save_output(output)
        t_done += 1
        await update_run_status(run_id, "running", completed_prompts=t_done)

    # Run baseline prompts (separate pass, silent progress)
    if baseline_model:
        for coro in asyncio.as_completed([bounded_baseline_run(p) for p in prompts]):
            output = await coro
            await save_baseline_output(output)

    # Final target metrics
    outputs = await get_run_outputs(run_id)
    metrics = aggregate_outputs(outputs)
    updates: dict = {
        "avg_safety": metrics.get("avg_safety"),
        "avg_helpfulness": metrics.get("avg_helpfulness"),
        "avg_refusal_correctness": metrics.get("avg_refusal_correctness"),
        "avg_policy_consistency": metrics.get("avg_policy_consistency"),
        "avg_tool_call_accuracy": metrics.get("avg_tool_call_accuracy"),
        "refusal_rate": metrics.get("refusal_rate"),
        "false_refusal_rate": metrics.get("false_refusal_rate"),
        "overall_score": metrics.get("overall_score"),
        "category_metrics": metrics.get("category_metrics"),
    }

    # Final baseline metrics
    if baseline_model:
        b_outputs = await get_baseline_outputs(run_id)
        b_metrics = aggregate_outputs(b_outputs)
        updates["baseline_metrics"] = {
            "avg_safety": b_metrics.get("avg_safety"),
            "avg_helpfulness": b_metrics.get("avg_helpfulness"),
            "avg_refusal_correctness": b_metrics.get("avg_refusal_correctness"),
            "avg_policy_consistency": b_metrics.get("avg_policy_consistency"),
            "avg_tool_call_accuracy": b_metrics.get("avg_tool_call_accuracy"),
            "refusal_rate": b_metrics.get("refusal_rate"),
            "false_refusal_rate": b_metrics.get("false_refusal_rate"),
            "overall_score": b_metrics.get("overall_score"),
            "category_metrics": b_metrics.get("category_metrics"),
        }

    await update_run_metrics(run_id, updates)
    await update_run_status(run_id, "completed", completed_prompts=len(outputs))

    logger.info("Run %s completed: %d outputs", run_id, len(outputs))


async def create_and_start_run(
    rules: list[dict],
    benchmark_mode: str,
    target_model: str,
    judge_mode: str,
    baseline_model: str | None = None,
    custom_prompts: list[dict] | None = None,
) -> str:
    ruleset_hash = hash_ruleset(rules)
    ruleset = await get_or_create_ruleset(ruleset_hash, rules)
    if custom_prompts:
        total = len(custom_prompts)
    else:
        standard_prompts = get_prompts(benchmark_mode)
        active_rule_ids = [r["id"] for r in rules if r.get("enabled", True)]
        edge_case_prompts = await get_edge_cases_for_rules(active_rule_ids)
        total = len(standard_prompts) + len(edge_case_prompts)

    run = await create_run(
        ruleset_id=ruleset.id,
        benchmark_mode=benchmark_mode,
        target_model=target_model,
        judge_mode=judge_mode,
        total_prompts=total,
        baseline_model=baseline_model,
    )

    asyncio.create_task(execute_run(run.id, rules, benchmark_mode, target_model, baseline_model, custom_prompts))
    return run.id
