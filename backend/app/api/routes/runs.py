import asyncio
import json
from typing import AsyncGenerator

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.run_orchestrator import create_and_start_run
from app.storage.database import get_db
from app.storage.repositories.run_repository import (
    get_run,
    get_run_outputs,
    list_runs,
)

router = APIRouter()


class RunRequest(BaseModel):
    rules: list[dict]
    benchmark_mode: str = "live"  # live | full
    target_model: str | None = None
    judge_mode: str = "fast"  # fast | strong
    scoring_weights: dict | None = None


def _serialize_run(run) -> dict:
    return {
        "id": run.id,
        "status": run.status,
        "benchmark_mode": run.benchmark_mode,
        "target_model": run.target_model,
        "judge_mode": run.judge_mode,
        "total_prompts": run.total_prompts,
        "completed_prompts": run.completed_prompts,
        "avg_safety": run.avg_safety,
        "avg_helpfulness": run.avg_helpfulness,
        "avg_refusal_correctness": run.avg_refusal_correctness,
        "avg_policy_consistency": run.avg_policy_consistency,
        "refusal_rate": run.refusal_rate,
        "false_refusal_rate": run.false_refusal_rate,
        "overall_score": run.overall_score,
        "category_metrics": run.category_metrics,
        "created_at": run.created_at.isoformat() if run.created_at else None,
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        "ruleset": {
            "id": run.ruleset.id,
            "hash": run.ruleset.hash,
            "rules": run.ruleset.rules,
        } if run.ruleset else None,
    }


def _serialize_output(o) -> dict:
    return {
        "id": o.id,
        "prompt_id": o.prompt_id,
        "category": o.category,
        "prompt": o.prompt,
        "expected_behavior": o.expected_behavior,
        "response": o.response,
        "refused": o.refused,
        "safety_score": o.safety_score,
        "helpfulness_score": o.helpfulness_score,
        "refusal_correctness": o.refusal_correctness,
        "policy_consistency": o.policy_consistency,
        "judge_reasoning": o.judge_reasoning,
        "error": o.error,
        "cached": o.cached,
    }


@router.post("")
async def create_run(req: RunRequest, db: AsyncSession = Depends(get_db)):
    model = req.target_model or settings.target_model
    run_id = await create_and_start_run(
        db=db,
        rules=req.rules,
        benchmark_mode=req.benchmark_mode,
        target_model=model,
        judge_mode=req.judge_mode,
    )
    return {"run_id": run_id, "status": "started"}


@router.get("")
async def list_all_runs(db: AsyncSession = Depends(get_db)):
    runs = await list_runs(db)
    return [_serialize_run(r) for r in runs]


@router.get("/{run_id}")
async def get_run_detail(run_id: str, db: AsyncSession = Depends(get_db)):
    run = await get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return _serialize_run(run)


@router.get("/{run_id}/outputs")
async def get_outputs(run_id: str, db: AsyncSession = Depends(get_db)):
    run = await get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    outputs = await get_run_outputs(db, run_id)
    return [_serialize_output(o) for o in outputs]


@router.get("/{run_id}/stream")
async def stream_run(run_id: str, db: AsyncSession = Depends(get_db)):
    """Server-sent events stream for real-time run progress."""

    async def event_generator() -> AsyncGenerator[str, None]:
        from app.storage.database import AsyncSessionLocal
        from app.storage.repositories.run_repository import get_run, get_run_outputs

        last_completed = -1
        while True:
            async with AsyncSessionLocal() as session:
                run = await get_run(session, run_id)
                if not run:
                    yield f"data: {json.dumps({'error': 'run not found'})}\n\n"
                    break

                if run.completed_prompts != last_completed or run.status in ("completed", "failed"):
                    outputs = await get_run_outputs(session, run_id)
                    payload = {
                        "status": run.status,
                        "total_prompts": run.total_prompts,
                        "completed_prompts": run.completed_prompts,
                        "outputs": [_serialize_output(o) for o in outputs],
                        "metrics": {
                            "avg_safety": run.avg_safety,
                            "avg_helpfulness": run.avg_helpfulness,
                            "avg_refusal_correctness": run.avg_refusal_correctness,
                            "avg_policy_consistency": run.avg_policy_consistency,
                            "refusal_rate": run.refusal_rate,
                            "false_refusal_rate": run.false_refusal_rate,
                            "overall_score": run.overall_score,
                            "category_metrics": run.category_metrics,
                        } if run.status == "completed" else None,
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                    last_completed = run.completed_prompts

                if run.status in ("completed", "failed"):
                    break

            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
