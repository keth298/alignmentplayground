import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.storage.database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


class Ruleset(Base):
    __tablename__ = "rulesets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    hash: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String, default="")
    rules: Mapped[dict] = mapped_column(JSON)  # list of rule objects
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    runs: Mapped[list["Run"]] = relationship("Run", back_populates="ruleset")


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    ruleset_id: Mapped[str] = mapped_column(ForeignKey("rulesets.id"), index=True)
    benchmark_mode: Mapped[str] = mapped_column(String)  # live | full
    target_model: Mapped[str] = mapped_column(String)
    judge_mode: Mapped[str] = mapped_column(String)  # fast | strong
    status: Mapped[str] = mapped_column(String, default="pending")  # pending|running|completed|failed
    total_prompts: Mapped[int] = mapped_column(default=0)
    completed_prompts: Mapped[int] = mapped_column(default=0)
    # Aggregate metrics stored after completion
    avg_safety: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_helpfulness: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_refusal_correctness: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_policy_consistency: Mapped[float | None] = mapped_column(Float, nullable=True)
    refusal_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    false_refusal_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    category_metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    ruleset: Mapped["Ruleset"] = relationship("Ruleset", back_populates="runs")
    outputs: Mapped[list["Output"]] = relationship("Output", back_populates="run", cascade="all, delete-orphan")


class Output(Base):
    __tablename__ = "outputs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    run_id: Mapped[str] = mapped_column(ForeignKey("runs.id"), index=True)
    prompt_id: Mapped[str] = mapped_column(String, index=True)
    category: Mapped[str] = mapped_column(String)
    prompt: Mapped[str] = mapped_column(Text)
    expected_behavior: Mapped[str] = mapped_column(String)
    response: Mapped[str | None] = mapped_column(Text, nullable=True)
    refused: Mapped[bool | None] = mapped_column(nullable=True)
    safety_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    helpfulness_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    refusal_correctness: Mapped[float | None] = mapped_column(Float, nullable=True)
    policy_consistency: Mapped[float | None] = mapped_column(Float, nullable=True)
    judge_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    cached: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    run: Mapped["Run"] = relationship("Run", back_populates="outputs")
