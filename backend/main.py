from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from db.database import create_tables
from routers.websocket import websocket_endpoint
from services.semantic_search import semantic_search
import logging

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