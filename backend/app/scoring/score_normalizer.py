"""Normalize raw judge scores into the standard 0.0–1.0 range."""


def clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


def normalize_score(raw: float) -> float:
    """Clamp a score to [0, 1] and round to 4 decimal places."""
    return round(clamp(float(raw)), 4)


def normalize_scores(scores: dict) -> dict:
    return {k: normalize_score(v) for k, v in scores.items()}
