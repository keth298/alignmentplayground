#!/usr/bin/env python3
"""Run a full benchmark evaluation and print aggregate metrics."""

import asyncio
import httpx
import json

BACKEND_URL = "http://localhost:8000"


async def run_full_eval():
    async with httpx.AsyncClient(base_url=BACKEND_URL, timeout=600) as client:
        resp = await client.get("/rules/default")
        resp.raise_for_status()
        rules = resp.json()

        payload = {
            "rules": rules,
            "benchmark_mode": "full",
            "model": "claude-sonnet",
            "judge_mode": "offline",
        }
        resp = await client.post("/runs", json=payload)
        resp.raise_for_status()
        run = resp.json()
        print(f"Started full run {run['id']}")

        while True:
            resp = await client.get(f"/runs/{run['id']}")
            data = resp.json()
            status = data.get("status")
            print(f"  status: {status}")
            if status in ("completed", "failed"):
                break
            await asyncio.sleep(5)

        resp = await client.get(f"/runs/{run['id']}/results")
        results = resp.json()
        print("\n=== Results ===")
        print(json.dumps(results, indent=2))


if __name__ == "__main__":
    asyncio.run(run_full_eval())
