import os
from openai import OpenAI
from dotenv import load_dotenv
import sys
sys.path.append("/Users/parinitasedai/Desktop/pulseboard/backend")
from db.database import SessionLocal
from db.models import Signal

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_embedding(text):
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def embed_signals_for_company(company_name):
    db = SessionLocal()
    try:
        signals = db.query(Signal).filter(Signal.embedding == None).all()
        for signal in signals:
            embedding = generate_embedding(signal.content)
            signal.embedding = embedding
            db.commit()
            print(f"Embedded: {signal.content[:50]}")
    finally:
        db.close()


if __name__ == "__main__":
    embed_signals_for_company("google")
