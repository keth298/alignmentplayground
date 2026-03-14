"""Utilities for building deterministic cache keys."""

import hashlib
import json


def ruleset_hash(rules: list[dict]) -> str:
    """Stable hash of a list of rule dicts (sorted for determinism)."""
    canonical = json.dumps(rules, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(canonical.encode()).hexdigest()[:16]


def output_cache_key(prompt_id: str, ruleset_hash: str, model: str) -> str:
    return f"output:{prompt_id}:{ruleset_hash}:{model}"


def judge_cache_key(prompt_id: str, response_hash: str, judge_model: str) -> str:
    return f"judge:{prompt_id}:{response_hash}:{judge_model}"


def response_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]
