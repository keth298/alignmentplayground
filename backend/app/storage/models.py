"""Plain dataclasses replacing the SQLAlchemy ORM models."""

import uuid
from dataclasses import dataclass, field
from datetime import datetime


def _new_uuid() -> str:
    return str(uuid.uuid4())


@dataclass
class Ruleset:
    hash: str
    rules: list
    id: str = field(default_factory=_new_uuid)
    name: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "hash": self.hash,
            "name": self.name,
            "rules": self.rules,
            "created_at": self.created_at,
        }

    @staticmethod
    def from_dict(data: dict) -> "Ruleset":
        return Ruleset(
            id=data["id"],
            hash=data["hash"],
            name=data.get("name", ""),
            rules=data.get("rules", []),
            created_at=data.get("created_at", datetime.utcnow()),
        )


@dataclass
class Run:
    ruleset_id: str
    benchmark_mode: str
    target_model: str
    judge_mode: str
    id: str = field(default_factory=_new_uuid)
    status: str = "pending"
    total_prompts: int = 0
    completed_prompts: int = 0
    avg_safety: float | None = None
    avg_helpfulness: float | None = None
    avg_refusal_correctness: float | None = None
    avg_policy_consistency: float | None = None
    avg_tool_call_accuracy: float | None = None
    refusal_rate: float | None = None
    false_refusal_rate: float | None = None
    overall_score: float | None = None
    category_metrics: dict | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    # Populated after load — not stored in Firestore
    ruleset: Ruleset | None = field(default=None, repr=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "ruleset_id": self.ruleset_id,
            "benchmark_mode": self.benchmark_mode,
            "target_model": self.target_model,
            "judge_mode": self.judge_mode,
            "status": self.status,
            "total_prompts": self.total_prompts,
            "completed_prompts": self.completed_prompts,
            "avg_safety": self.avg_safety,
            "avg_helpfulness": self.avg_helpfulness,
            "avg_refusal_correctness": self.avg_refusal_correctness,
            "avg_policy_consistency": self.avg_policy_consistency,
            "avg_tool_call_accuracy": self.avg_tool_call_accuracy,
            "refusal_rate": self.refusal_rate,
            "false_refusal_rate": self.false_refusal_rate,
            "overall_score": self.overall_score,
            "category_metrics": self.category_metrics,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
        }

    @staticmethod
    def from_dict(data: dict) -> "Run":
        return Run(
            id=data["id"],
            ruleset_id=data["ruleset_id"],
            benchmark_mode=data["benchmark_mode"],
            target_model=data["target_model"],
            judge_mode=data["judge_mode"],
            status=data.get("status", "pending"),
            total_prompts=data.get("total_prompts", 0),
            completed_prompts=data.get("completed_prompts", 0),
            avg_safety=data.get("avg_safety"),
            avg_helpfulness=data.get("avg_helpfulness"),
            avg_refusal_correctness=data.get("avg_refusal_correctness"),
            avg_policy_consistency=data.get("avg_policy_consistency"),
            avg_tool_call_accuracy=data.get("avg_tool_call_accuracy"),
            refusal_rate=data.get("refusal_rate"),
            false_refusal_rate=data.get("false_refusal_rate"),
            overall_score=data.get("overall_score"),
            category_metrics=data.get("category_metrics"),
            created_at=data.get("created_at", datetime.utcnow()),
            completed_at=data.get("completed_at"),
        )


@dataclass
class Output:
    run_id: str
    prompt_id: str
    category: str
    prompt: str
    expected_behavior: str
    id: str = field(default_factory=_new_uuid)
    response: str | None = None
    refused: bool | None = None
    safety_score: float | None = None
    helpfulness_score: float | None = None
    refusal_correctness: float | None = None
    policy_consistency: float | None = None
    judge_reasoning: str | None = None
    tool_call_accuracy: float | None = None
    tool_calls_made: list | None = None
    error: str | None = None
    cached: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "run_id": self.run_id,
            "prompt_id": self.prompt_id,
            "category": self.category,
            "prompt": self.prompt,
            "expected_behavior": self.expected_behavior,
            "response": self.response,
            "refused": self.refused,
            "safety_score": self.safety_score,
            "helpfulness_score": self.helpfulness_score,
            "refusal_correctness": self.refusal_correctness,
            "policy_consistency": self.policy_consistency,
            "judge_reasoning": self.judge_reasoning,
            "tool_call_accuracy": self.tool_call_accuracy,
            "tool_calls_made": self.tool_calls_made,
            "error": self.error,
            "cached": self.cached,
            "created_at": self.created_at,
        }

    @staticmethod
    def from_dict(data: dict) -> "Output":
        return Output(
            id=data["id"],
            run_id=data["run_id"],
            prompt_id=data["prompt_id"],
            category=data["category"],
            prompt=data["prompt"],
            expected_behavior=data["expected_behavior"],
            response=data.get("response"),
            refused=data.get("refused"),
            safety_score=data.get("safety_score"),
            helpfulness_score=data.get("helpfulness_score"),
            refusal_correctness=data.get("refusal_correctness"),
            policy_consistency=data.get("policy_consistency"),
            judge_reasoning=data.get("judge_reasoning"),
            tool_call_accuracy=data.get("tool_call_accuracy"),
            tool_calls_made=data.get("tool_calls_made"),
            error=data.get("error"),
            cached=data.get("cached", False),
            created_at=data.get("created_at", datetime.utcnow()),
        )
