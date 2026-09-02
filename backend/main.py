import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import create_tables
from services.ai_analyzer import analyze_company, save_summary
from services.cache import get_cached, get_cache_stats, set_cache
from services.github_ingester import fetch_github_data, save_signals
from services.news_ingester import fetch_news_data
from services.semantic_search import semantic_search

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PulseBoard API")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    os.getenv("FRONTEND_URL"),
]
allowed_origins = [origin for origin in allowed_origins if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    try:
        create_tables()
        logger.info("Tables created successfully")
    except Exception as e:
        logger.error(f"Error creating tables: {e}")


@app.get("/")
def root():
    return {"message": "PulseBoard API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/health/redis")
def redis_health():
    from services.cache import r

    try:
        return {
            "configured": bool(os.getenv("REDIS_URL")),
            "connected": bool(r.ping())
        }
    except Exception as e:
        return {
            "configured": bool(os.getenv("REDIS_URL")),
            "connected": False,
            "error": type(e).__name__
        }
    
@app.get("/metrics/cache")
def metrics_cache():
    return get_cache_stats()


@app.get("/analyze/{company_name}")
def analyze(company_name: str):
    company_name = company_name.strip().lower()
    cache_key = f"analysis:{company_name}"
    cached_result = get_cached(cache_key)
    if cached_result:
        logger.info(f"Returning cached analysis for {company_name}")
        return cached_result

    try:
        github_signals = fetch_github_data(company_name)
        save_signals(company_name, github_signals)

        news_signals = fetch_news_data(company_name)
        save_signals(company_name, news_signals)

        result = analyze_company(company_name)
        save_summary(company_name, result["summary"], result["sentiment"])

        response = {
            "status": "complete",
            "summary": result["summary"],
            "sentiment": result["sentiment"],
            "company": company_name,
        }
        set_cache(cache_key, response, ttl=86400)
        return response
    except Exception as e:
        logger.exception("Analyze request failed")
        return {"status": "error", "message": str(e)}


@app.get("/search")
def search(query: str):
    results = semantic_search(query)
    return {"results": results}