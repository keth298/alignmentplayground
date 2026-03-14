"""Firestore-backed repository replacing the SQLAlchemy run_repository."""

import logging
from datetime import datetime

from app.storage.database import get_firestore
from app.storage.models import Output, Run, Ruleset

logger = logging.getLogger(__name__)

RULESETS = "rulesets"
RUNS = "runs"
OUTPUTS = "outputs"


# ── Rulesets ──────────────────────────────────────────────────────────────────

async def get_or_create_ruleset(hash: str, rules: list, name: str = "") -> Ruleset:
    db = get_firestore()
    query = db.collection(RULESETS).where("hash", "==", hash).limit(1)
    async for doc in query.stream():
        return Ruleset.from_dict(doc.to_dict())
    rs = Ruleset(hash=hash, rules=rules, name=name)
    await db.collection(RULESETS).document(rs.id).set(rs.to_dict())
    return rs


# ── Runs ──────────────────────────────────────────────────────────────────────

async def create_run(
    ruleset_id: str,
    benchmark_mode: str,
    target_model: str,
    judge_mode: str,
    total_prompts: int,
) -> Run:
    db = get_firestore()
    run = Run(
        ruleset_id=ruleset_id,
        benchmark_mode=benchmark_mode,
        target_model=target_model,
        judge_mode=judge_mode,
        status="pending",
        total_prompts=total_prompts,
    )
    await db.collection(RUNS).document(run.id).set(run.to_dict())
    return run


async def get_run(run_id: str) -> Run | None:
    db = get_firestore()
    doc = await db.collection(RUNS).document(run_id).get()
    if not doc.exists:
        return None
    run = Run.from_dict(doc.to_dict())
    # Load associated ruleset
    rs_doc = await db.collection(RULESETS).document(run.ruleset_id).get()
    if rs_doc.exists:
        run.ruleset = Ruleset.from_dict(rs_doc.to_dict())
    return run


async def list_runs(limit: int = 50) -> list[Run]:
    db = get_firestore()
    query = db.collection(RUNS).order_by("created_at", direction="DESCENDING").limit(limit)
    runs: list[Run] = []
    async for doc in query.stream():
        runs.append(Run.from_dict(doc.to_dict()))

    # Batch-load rulesets
    ruleset_ids = {r.ruleset_id for r in runs}
    rulesets: dict[str, Ruleset] = {}
    for rs_id in ruleset_ids:
        rs_doc = await db.collection(RULESETS).document(rs_id).get()
        if rs_doc.exists:
            rulesets[rs_id] = Ruleset.from_dict(rs_doc.to_dict())
    for run in runs:
        run.ruleset = rulesets.get(run.ruleset_id)

    return runs


async def update_run_status(
    run_id: str,
    status: str,
    completed_prompts: int | None = None,
) -> None:
    db = get_firestore()
    updates: dict = {"status": status}
    if completed_prompts is not None:
        updates["completed_prompts"] = completed_prompts
    if status == "completed":
        updates["completed_at"] = datetime.utcnow()
    await db.collection(RUNS).document(run_id).update(updates)


async def update_run_metrics(run_id: str, metrics: dict) -> None:
    db = get_firestore()
    await db.collection(RUNS).document(run_id).update(metrics)


# ── Outputs ───────────────────────────────────────────────────────────────────

async def save_output(output: Output) -> None:
    db = get_firestore()
    await db.collection(OUTPUTS).document(output.id).set(output.to_dict())


async def get_run_outputs(run_id: str) -> list[Output]:
    db = get_firestore()
    query = db.collection(OUTPUTS).where("run_id", "==", run_id)
    outputs: list[Output] = []
    async for doc in query.stream():
        outputs.append(Output.from_dict(doc.to_dict()))
    return outputs
