import os
from dotenv import load_dotenv
import sys
sys.path.append("/Users/parinitasedai/Desktop/pulseboard/backend")
from db.database import SessionLocal
from db.models import Signal, Company
from services.embeddings import generate_embedding
from sqlalchemy import text

load_dotenv()

def semantic_search(query, limit=5):
    db = SessionLocal()
    try:
        query_embedding = generate_embedding(query)
        
        results = db.execute(text("""
            SELECT s.content, s.source, s.url, c.name as company_name,
                   1 - (s.embedding <=> CAST(:embedding AS vector)) as similarity
            FROM signals s
            JOIN companies c ON s.company_id = c.id
            WHERE s.embedding IS NOT NULL
            ORDER BY s.embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
        """), {"embedding": str(query_embedding), "limit": limit})
        
        return [dict(row._mapping) for row in results]
    finally:
        db.close()

if __name__ == "__main__":
    results = semantic_search("artificial intelligence and machine learning")
    for r in results:
        print(r["company_name"], "-", r["content"][:60], "-", round(r["similarity"], 3))