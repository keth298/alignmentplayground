from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.storage.repositories.run_repository import get_run, get_run_outputs

router = APIRouter()


class CompareRequest(BaseModel):
    run_id_a: str
    run_id_b: str


@router.post("")
async def compare_runs(req: CompareRequest):
    run_a = await get_run(req.run_id_a)
    run_b = await get_run(req.run_id_b)

    if not run_a or not run_b:
        raise HTTPException(status_code=404, detail="One or both runs not found")

    outputs_a = await get_run_outputs(req.run_id_a)
    outputs_b = await get_run_outputs(req.run_id_b)

    map_b = {o.prompt_id: o for o in outputs_b}
    diffs = []
    for oa in outputs_a:
        ob = map_b.get(oa.prompt_id)
        if ob and oa.safety_score is not None and ob.safety_score is not None:
            diffs.append({
                "prompt_id": oa.prompt_id,
                "category": oa.category,
                "prompt": oa.prompt,
                "run_a": {
                    "safety": oa.safety_score,
                    "helpfulness": oa.helpfulness_score,
                    "refused": oa.refused,
                    "response": oa.response,
                },
                "run_b": {
                    "safety": ob.safety_score,
                    "helpfulness": ob.helpfulness_score,
                    "refused": ob.refused,
                    "response": ob.response,
                },
                "delta_safety": (ob.safety_score or 0) - (oa.safety_score or 0),
                "delta_helpfulness": (ob.helpfulness_score or 0) - (oa.helpfulness_score or 0),
            })

    def _metrics(run):
        return {
            "avg_safety": run.avg_safety,
            "avg_helpfulness": run.avg_helpfulness,
            "avg_refusal_correctness": run.avg_refusal_correctness,
            "avg_policy_consistency": run.avg_policy_consistency,
            "refusal_rate": run.refusal_rate,
            "false_refusal_rate": run.false_refusal_rate,
            "overall_score": run.overall_score,
            "category_metrics": run.category_metrics,
        }

    metrics_a = _metrics(run_a)
    metrics_b = _metrics(run_b)

    deltas = {
        k: (metrics_b.get(k) or 0) - (metrics_a.get(k) or 0)
        for k in ["avg_safety", "avg_helpfulness", "refusal_rate", "false_refusal_rate", "overall_score"]
        if metrics_a.get(k) is not None and metrics_b.get(k) is not None
    }

    return {
        "run_a": {"id": run_a.id, "metrics": metrics_a, "ruleset": run_a.ruleset.rules if run_a.ruleset else []},
        "run_b": {"id": run_b.id, "metrics": metrics_b, "ruleset": run_b.ruleset.rules if run_b.ruleset else []},
        "deltas": deltas,
        "prompt_diffs": diffs,
    }
