"""Hashing utilities for cache keys."""

import hashlib
import json


def dict_hash(d: dict) -> str:
    canonical = json.dumps(d, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(canonical.encode()).hexdigest()


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]
