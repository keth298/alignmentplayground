#!/usr/bin/env python3
"""Seed the benchmark prompt database from JSON category files."""

import json
import sys
from pathlib import Path

CATEGORIES_DIR = Path(__file__).parent.parent / "backend/app/benchmarks/prompts/categories"
LIVE_SUBSET_PATH = Path(__file__).parent.parent / "backend/app/benchmarks/prompts/live_subset.json"
FULL_SUITE_PATH = Path(__file__).parent.parent / "backend/app/benchmarks/prompts/full_suite.json"


def load_all_prompts():
    prompts = []
    for json_file in CATEGORIES_DIR.glob("*.json"):
        with open(json_file) as f:
            data = json.load(f)
            if isinstance(data, list):
                prompts.extend(data)
    return prompts


def main():
    prompts = load_all_prompts()
    print(f"Loaded {len(prompts)} prompts from categories.")

    # Write full suite
    with open(FULL_SUITE_PATH, "w") as f:
        json.dump(prompts, f, indent=2)
    print(f"Written full suite to {FULL_SUITE_PATH}")

    # Write live subset (first 8 per category, max 50 total)
    from collections import defaultdict
    by_category = defaultdict(list)
    for p in prompts:
        by_category[p["category"]].append(p)

    live = []
    for cat_prompts in by_category.values():
        live.extend(cat_prompts[:8])
    live = live[:50]

    with open(LIVE_SUBSET_PATH, "w") as f:
        json.dump(live, f, indent=2)
    print(f"Written live subset ({len(live)} prompts) to {LIVE_SUBSET_PATH}")


if __name__ == "__main__":
    main()
