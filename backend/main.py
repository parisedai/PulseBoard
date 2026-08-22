from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from db.database import create_tables
from routers.websocket import websocket_endpoint
from services.github_ingester import fetch_github_data, save_signals
from services.news_ingester import fetch_news_data
from services.ai_analyzer import analyze_company, save_summary
import logging

@app.get("/analyze/{company_name}")
def analyze(company_name: str):
    try:
        github_signals = fetch_github_data(company_name)
        save_signals(company_name, github_signals)
        news_signals = fetch_news_data(company_name)
        save_signals(company_name, news_signals)
        result = analyze_company(company_name)
        save_summary(company_name, result["summary"], result["sentiment"])
        return {
            "status": "complete",
            "summary": result["summary"],
            "sentiment": result["sentiment"],
            "company": company_name
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

@app.websocket("/ws/{company_name}")
async def websocket_route(websocket: WebSocket, company_name: str):
    await websocket_endpoint(websocket, company_name)

@app.get("/search")
def search(query: str):
    results = semantic_search(query)
    return {"results": results}