#!/usr/bin/env python3
"""Export a completed run's results to a JSON report file."""

import asyncio
import httpx
import json
import sys
from datetime import datetime
from pathlib import Path

BACKEND_URL = "http://localhost:8000"
EXPORTS_DIR = Path(__file__).parent.parent / "data/exports"


async def export_report(run_id: str):
    async with httpx.AsyncClient(base_url=BACKEND_URL, timeout=60) as client:
        resp = await client.get(f"/runs/{run_id}/results")
        resp.raise_for_status()
        results = resp.json()

        resp = await client.get(f"/runs/{run_id}/outputs")
        resp.raise_for_status()
        outputs = resp.json()

    report = {
        "run_id": run_id,
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "metrics": results,
        "outputs": outputs,
    }

    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = EXPORTS_DIR / f"report_{run_id}.json"
    with open(out_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Report saved to {out_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: export_report.py <run_id>")
        sys.exit(1)
    asyncio.run(export_report(sys.argv[1]))
