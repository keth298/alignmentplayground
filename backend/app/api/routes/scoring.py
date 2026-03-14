from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/scoring", tags=["scoring"])


class PreviewRequest(BaseModel):
    rules: List[dict]
    session_id: str | None = None


class FullScoringRequest(BaseModel):
    run_id: str


@router.post("/preview")
async def scoring_preview(request: PreviewRequest):
    """Fast re-score using cached per-output scores — no new model calls."""
    # TODO: load cached outputs for current session, reweight by new rules, return aggregates
    return {
        "safety": 0.82,
        "helpfulness": 0.74,
        "refusal_rate": 0.12,
        "false_refusal_rate": 0.06,
        "policy_consistency": 0.79,
    }


@router.post("/full")
async def scoring_full(request: FullScoringRequest):
    """Trigger full re-evaluation of a completed run."""
    # TODO: enqueue full scoring job
    return {"status": "enqueued", "run_id": request.run_id}
