from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.storage.models import Output, Run, Ruleset


async def get_or_create_ruleset(db: AsyncSession, hash: str, rules: list, name: str = "") -> Ruleset:
    result = await db.execute(select(Ruleset).where(Ruleset.hash == hash))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    rs = Ruleset(hash=hash, rules=rules, name=name)
    db.add(rs)
    await db.flush()
    return rs


async def create_run(db: AsyncSession, ruleset_id: str, benchmark_mode: str,
                     target_model: str, judge_mode: str, total_prompts: int) -> Run:
    run = Run(
        ruleset_id=ruleset_id,
        benchmark_mode=benchmark_mode,
        target_model=target_model,
        judge_mode=judge_mode,
        status="pending",
        total_prompts=total_prompts,
    )
    db.add(run)
    await db.flush()
    return run


async def get_run(db: AsyncSession, run_id: str) -> Run | None:
    result = await db.execute(
        select(Run).options(selectinload(Run.ruleset)).where(Run.id == run_id)
    )
    return result.scalar_one_or_none()


async def get_run_outputs(db: AsyncSession, run_id: str) -> list[Output]:
    result = await db.execute(select(Output).where(Output.run_id == run_id))
    return list(result.scalars().all())


async def list_runs(db: AsyncSession, limit: int = 50) -> list[Run]:
    result = await db.execute(
        select(Run).options(selectinload(Run.ruleset)).order_by(Run.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())


async def update_run_status(db: AsyncSession, run_id: str, status: str,
                            completed_prompts: int | None = None) -> None:
    run = await db.get(Run, run_id)
    if not run:
        return
    run.status = status
    if completed_prompts is not None:
        run.completed_prompts = completed_prompts
    if status == "completed":
        run.completed_at = datetime.utcnow()
    await db.flush()


async def save_output(db: AsyncSession, output: Output) -> None:
    db.add(output)
    await db.flush()


async def update_run_metrics(db: AsyncSession, run_id: str, metrics: dict) -> None:
    run = await db.get(Run, run_id)
    if not run:
        return
    for k, v in metrics.items():
        setattr(run, k, v)
    await db.flush()
