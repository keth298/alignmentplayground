from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RunCreate(BaseModel):
    rules: list[dict]
    benchmark_mode: str = "live"
    model: str = "claude-sonnet"
    judge_mode: str = "local_fast"


class RunResponse(BaseModel):
    id: str
    ruleset_id: str
    benchmark_mode: str
    target_model: str
    judge_mode: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class RunResultsResponse(BaseModel):
    run_id: str
    safety: float
    helpfulness: float
    refusal_rate: float
    false_refusal_rate: float
    policy_consistency: float
