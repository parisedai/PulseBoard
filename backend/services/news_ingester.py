import os
import requests
from dotenv import load_dotenv
import sys
sys.path.append("/Users/parinitasedai/Desktop/pulseboard/backend")
from db.database import SessionLocal
from db.models import Signal, Company
from services.cache import get_cached, set_cache


load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

def fetch_news_data(company_name):
    cache_key = f"news:{company_name}"
    cached = get_cached(cache_key)
    if cached:
        print("cache hit!")
        return cached
    
    url = f"https://newsapi.org/v2/everything?q={company_name}&apiKey={NEWS_API_KEY}&pageSize=10"
    response = requests.get(url)
    articles = response.json().get("articles", [])
    
    signals = []
    for article in articles:
        signals.append({
            "source": "news",
            "content": f"{article['title']}: {article['description']}",
            "url": article['url']
        })
    
    set_cache(cache_key, signals)
    return signals

def save_signals(company_name, signals):
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.name == company_name).first()
        if not company:
            company = Company(name=company_name, industry="unknown")
            db.add(company)
            db.commit()
            db.refresh(company)
        
        for signal in signals:
            db_signal = Signal(
                company_id=company.id,
                source=signal["source"],
                content=signal["content"],
                url=signal["url"]
            )
            db.add(db_signal)
        
        db.commit()
        print(f"Saved {len(signals)} signals for {company_name}")
    finally:
        db.close()

if __name__ == "__main__":
    print("First call:")
    signals = fetch_news_data("google")
    print(f"fetched {len(signals)} signals")
    
    print("\nSecond call:")
    signals = fetch_news_data("google")
    print(f"fetched {len(signals)} signals")