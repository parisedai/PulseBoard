import json
import os

import redis
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.from_url(redis_url, decode_responses=True)

CACHE_STATS = {
    "hits": 0,
    "misses": 0,
}


def get_cached(key):
    try:
        data = r.get(key)
        if data:
            CACHE_STATS["hits"] += 1
            return json.loads(data)
        CACHE_STATS["misses"] += 1
    except Exception:
        CACHE_STATS["misses"] += 1
        return None
    return None


def set_cache(key, value, ttl=3600):
    try:
        r.set(key, json.dumps(value), ex=ttl)
        return True
    except Exception:
        return False


def get_cache_stats():
    total = CACHE_STATS["hits"] + CACHE_STATS["misses"]
    hit_rate = 0.0
    if total:
        hit_rate = CACHE_STATS["hits"] / total
    return {
        "hits": CACHE_STATS["hits"],
        "misses": CACHE_STATS["misses"],
        "total": total,
        "hit_rate": hit_rate,
    }


def reset_cache_stats():
    CACHE_STATS["hits"] = 0
    CACHE_STATS["misses"] = 0
    return get_cache_stats()