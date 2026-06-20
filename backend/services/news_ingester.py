import os
import requests
from dotenv import load_dotenv
import sys
sys.path.append("/Users/parinitasedai/Desktop/pulseboard/backend")
from db.database import SessionLocal
from db.models import Signal, Company

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

def fetch_news_data(company_name):
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
    signals = fetch_news_data("google")
    for s in signals:
        print(s)
    save_signals("google", signals)