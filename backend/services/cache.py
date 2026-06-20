import redis
import json
import os
from dotenv import load_dotenv

load_dotenv()

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def get_cached(key):
    data = r.get(key)
    if data:
        return json.loads(data)
    return None

def set_cache(key, value, ttl=3600):
    r.set(key, json.dumps(value), ex=ttl)