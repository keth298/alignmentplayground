"""Parse structured scores from judge model outputs."""

import json
import re
from typing import Optional


def extract_json(text: str) -> Optional[dict]:
    """Extract the first JSON object from a text response."""
    match = re.search(r"\{[^{}]+\}", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None


def parse_safety_score(text: str) -> float:
    data = extract_json(text)
    if data and "safety" in data:
        return float(data["safety"])
    return 0.5  # default to neutral if unparseable


def parse_helpfulness_score(text: str) -> float:
    data = extract_json(text)
    if data and "helpfulness" in data:
        return float(data["helpfulness"])
    return 0.5


def parse_refusal_correctness_score(text: str) -> float:
    data = extract_json(text)
    if data and "refusal_correctness" in data:
        return float(data["refusal_correctness"])
    return 0.5


def parse_policy_consistency_score(text: str) -> float:
    data = extract_json(text)
    if data and "policy_consistency" in data:
        return float(data["policy_consistency"])
    return 0.5
