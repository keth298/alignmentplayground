"""In-memory cache replacing Redis. TTL-based, process-local."""

import time

from app.config import settings

_cache: dict[str, tuple[dict, float]] = {}


async def cache_get(key: str) -> dict | None:
    entry = _cache.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if time.monotonic() > expires_at:
        del _cache[key]
        return None
    return value


async def cache_set(key: str, value: dict, ttl: int = settings.cache_ttl) -> None:
    _cache[key] = (value, time.monotonic() + ttl)


def model_output_key(model: str, ruleset_hash: str, prompt_id: str) -> str:
    return f"output:{model}:{ruleset_hash}:{prompt_id}"


def score_key(judge_model: str, prompt_id: str, response_hash: str) -> str:
    return f"score:{judge_model}:{prompt_id}:{response_hash}"
