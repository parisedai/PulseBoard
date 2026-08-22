import json
import os

import redis
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.from_url(redis_url, decode_responses=True)


def get_cached(key):
    try:
        data = r.get(key)
        if data:
            return json.loads(data)
    except Exception:
        return None
    return None


def set_cache(key, value, ttl=3600):
    try:
        r.set(key, json.dumps(value), ex=ttl)
        return True
    except Exception:
        return False