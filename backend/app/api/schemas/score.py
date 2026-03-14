from pydantic import BaseModel


class PerOutputScores(BaseModel):
    safety: float
    helpfulness: float
    refusal_correctness: float
    policy_consistency: float


class OutputRecord(BaseModel):
    prompt_id: str
    category: str
    prompt: str
    response: str
    scores: PerOutputScores


class AggregateMetrics(BaseModel):
    safety: float
    helpfulness: float
    refusal_rate: float
    false_refusal_rate: float
    policy_consistency: float


class MetricDelta(BaseModel):
    safety: float
    helpfulness: float
    refusal_rate: float
    false_refusal_rate: float
    policy_consistency: float
