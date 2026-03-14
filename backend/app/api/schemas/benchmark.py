from pydantic import BaseModel
from typing import Optional


class BenchmarkPrompt(BaseModel):
    id: str
    category: str
    prompt: str
    expected_behavior: str
    tags: list[str] = []
    difficulty: Optional[str] = None


class BenchmarkListResponse(BaseModel):
    prompts: list[BenchmarkPrompt]
    total: int
    mode: str
