#!/usr/bin/env python3
"""Pre-run the live benchmark with the default ruleset to warm the cache."""

import asyncio
import httpx

BACKEND_URL = "http://localhost:8000"


async def preload():
    async with httpx.AsyncClient(base_url=BACKEND_URL, timeout=120) as client:
        # Load default rules
        resp = await client.get("/rules/default")
        resp.raise_for_status()
        rules = resp.json()

        # Start a live run
        payload = {
            "rules": rules,
            "benchmark_mode": "live",
            "model": "claude-sonnet",
            "judge_mode": "local_fast",
        }
        resp = await client.post("/runs", json=payload)
        resp.raise_for_status()
        run = resp.json()
        print(f"Started run {run['id']}, waiting for completion...")

        # Poll until done
        while True:
            resp = await client.get(f"/runs/{run['id']}")
            status = resp.json().get("status")
            print(f"  status: {status}")
            if status in ("completed", "failed"):
                break
            await asyncio.sleep(2)

        print("Cache preloaded.")


if __name__ == "__main__":
    asyncio.run(preload())
