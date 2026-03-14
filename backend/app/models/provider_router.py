"""Routes model calls to the appropriate provider based on model name."""

from app.models.target_model_client import ClaudeTargetClient, TargetModelClient
from app.models.open_source_judge_client import OpenSourceJudgeClient


def get_target_client(model: str) -> TargetModelClient:
    if model.startswith("claude"):
        return ClaudeTargetClient(model=model)
    raise ValueError(f"Unsupported target model: {model}")


def get_judge_client(judge_mode: str):
    if judge_mode == "local_fast":
        return OpenSourceJudgeClient()
    if judge_mode == "offline":
        # Use a stronger Claude model for offline judging
        return ClaudeTargetClient(model="claude-opus-4-6")
    raise ValueError(f"Unsupported judge mode: {judge_mode}")
