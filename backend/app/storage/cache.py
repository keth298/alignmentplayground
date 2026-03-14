import json

import redis.asyncio as aioredis

from app.config import settings

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def cache_get(key: str) -> dict | None:
    r = get_redis()
    val = await r.get(key)
    if val:
        return json.loads(val)
    return None


async def cache_set(key: str, value: dict, ttl: int = settings.cache_ttl) -> None:
    r = get_redis()
    await r.set(key, json.dumps(value), ex=ttl)


def model_output_key(model: str, ruleset_hash: str, prompt_id: str) -> str:
    return f"output:{model}:{ruleset_hash}:{prompt_id}"


def score_key(judge_model: str, prompt_id: str, response_hash: str) -> str:
    return f"score:{judge_model}:{prompt_id}:{response_hash}"
