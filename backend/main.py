from fastapi import FastAPI
from db.database import create_tables
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

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