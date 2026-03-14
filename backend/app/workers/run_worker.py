"""Worker that processes a full benchmark run asynchronously."""

from app.core.run_orchestrator import RunOrchestrator


async def process_run(run_id: str, ruleset: dict, benchmark_mode: str, model: str, judge_mode: str):
    """Execute a run end-to-end and persist results."""
    orchestrator = RunOrchestrator()
    await orchestrator.execute(
        run_id=run_id,
        ruleset=ruleset,
        benchmark_mode=benchmark_mode,
        model=model,
        judge_mode=judge_mode,
    )
