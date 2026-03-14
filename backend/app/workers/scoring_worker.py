"""Worker that runs the scoring pipeline for a completed run."""

from app.scoring.judge_runner import JudgeRunner
from app.scoring.aggregate_scores import compute_aggregate


async def score_run_outputs(run_id: str, outputs: list[dict], judge_mode: str) -> dict:
    """Score all outputs for a run and return aggregate metrics."""
    runner = JudgeRunner(judge_mode=judge_mode)
    scored_outputs = await runner.score_batch(outputs)
    return compute_aggregate(scored_outputs)
