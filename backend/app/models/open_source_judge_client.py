"""Client for open-source judge models used in fast local evaluation."""

import httpx
from typing import Optional


class OpenSourceJudgeClient:
    """Calls a local or hosted open-source model for fast judging."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3"):
        self.base_url = base_url
        self.model = model

    async def judge(self, prompt: str) -> str:
        """Send a judge prompt and return raw text response."""
        async with httpx.AsyncClient(base_url=self.base_url, timeout=30) as client:
            resp = await client.post(
                "/api/generate",
                json={"model": self.model, "prompt": prompt, "stream": False},
            )
            resp.raise_for_status()
            return resp.json().get("response", "")
