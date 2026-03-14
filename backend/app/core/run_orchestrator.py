import asyncio
import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.benchmarks.loaders import get_prompts
from app.config import settings
from app.core.metrics_aggregator import aggregate_outputs
from app.core.prompt_builder import build_system_prompt, hash_ruleset
from app.models.claude_client import complete, complete_with_tools
from app.models.tools import TOOLS
from app.scoring.judge_runner import score_response
from app.scoring.tool_call_scorer import TOOL_CALL_BEHAVIORS, score_tool_call
from app.storage.cache import cache_get, cache_set, model_output_key
from app.storage.database import AsyncSessionLocal
from app.storage.models import Output
from app.storage.repositories.run_repository import (
    create_run,
    get_or_create_ruleset,
    get_run_outputs,
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
        # Map refuse_tool_call → "refuse" for regular judge scoring
        judge_expected = (
            "refuse" if prompt_data["expected_behavior"] == "refuse_tool_call" else "helpful"
        )
    else:
        judge_expected = prompt_data["expected_behavior"]

    # Score with judge (applies to all prompts)
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


async def execute_run(run_id: str, rules: list[dict], benchmark_mode: str, target_model: str) -> None:
    """Background task: runs all benchmark prompts and saves results to DB."""
    prompts = get_prompts(benchmark_mode)
    system_prompt = build_system_prompt(rules)
    ruleset_hash = hash_ruleset(rules)
    rules_summary = "; ".join(
        r["label"] for r in rules if r.get("enabled", True)
    ) or "no active rules"

    semaphore = asyncio.Semaphore(settings.concurrency)

    async def bounded_run(p: dict) -> Output:
        async with semaphore:
            return await _run_single_prompt(p, system_prompt, ruleset_hash, rules_summary, run_id, target_model)

    async with AsyncSessionLocal() as db:
        await update_run_status(db, run_id, "running")
        await db.commit()

    completed = 0
    tasks = [bounded_run(p) for p in prompts]

    async with AsyncSessionLocal() as db:
        for coro in asyncio.as_completed(tasks):
            output = await coro
            await save_output(db, output)
            completed += 1
            await update_run_status(db, run_id, "running", completed_prompts=completed)
            await db.commit()

    # Final metrics
    async with AsyncSessionLocal() as db:
        outputs = await get_run_outputs(db, run_id)
        metrics = aggregate_outputs(outputs)
        metrics["status"] = "completed"
        metrics["completed_at"] = datetime.utcnow()
        await update_run_metrics(db, run_id, {
            "avg_safety": metrics.get("avg_safety"),
            "avg_helpfulness": metrics.get("avg_helpfulness"),
            "avg_refusal_correctness": metrics.get("avg_refusal_correctness"),
            "avg_policy_consistency": metrics.get("avg_policy_consistency"),
            "avg_tool_call_accuracy": metrics.get("avg_tool_call_accuracy"),
            "refusal_rate": metrics.get("refusal_rate"),
            "false_refusal_rate": metrics.get("false_refusal_rate"),
            "overall_score": metrics.get("overall_score"),
            "category_metrics": metrics.get("category_metrics"),
        })
        await update_run_status(db, run_id, "completed", completed_prompts=len(outputs))
        await db.commit()

    logger.info("Run %s completed: %d outputs", run_id, completed)


async def create_and_start_run(
    db: AsyncSession,
    rules: list[dict],
    benchmark_mode: str,
    target_model: str,
    judge_mode: str,
) -> str:
    ruleset_hash = hash_ruleset(rules)
    ruleset = await get_or_create_ruleset(db, ruleset_hash, rules)
    prompts = get_prompts(benchmark_mode)

    run = await create_run(
        db,
        ruleset_id=ruleset.id,
        benchmark_mode=benchmark_mode,
        target_model=target_model,
        judge_mode=judge_mode,
        total_prompts=len(prompts),
    )
    await db.commit()

    # Fire and forget
    asyncio.create_task(execute_run(run.id, rules, benchmark_mode, target_model))
    return run.id
