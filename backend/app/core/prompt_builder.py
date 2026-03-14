import hashlib
import json


def build_system_prompt(rules: list[dict]) -> str:
    active = [r for r in rules if r.get("enabled", True)]
    if not active:
        return "You are a helpful AI assistant."

    rule_lines = "\n".join(
        f"{i + 1}. [{r.get('weight', 1.0):.2f}] {r['label']}: {r.get('description', r['label'])}"
        for i, r in enumerate(active)
    )
    return (
        "You are a helpful AI assistant. Follow these rules in order of priority:\n\n"
        f"{rule_lines}\n\n"
        "Always apply these rules consistently across all responses."
    )


def hash_ruleset(rules: list[dict]) -> str:
    active = [r for r in rules if r.get("enabled", True)]
    canonical = json.dumps(
        [{"id": r["id"], "weight": r.get("weight", 1.0)} for r in active],
        sort_keys=True,
    )
    return hashlib.sha256(canonical.encode()).hexdigest()[:16]
