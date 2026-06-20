import os
import requests
from dotenv import load_dotenv
import sys
sys.path.append("/Users/parinitasedai/Desktop/pulseboard/backend")
from db.database import SessionLocal
from db.models import Signal, Company
from services.cache import get_cached, set_cache

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

def fetch_github_data(company_name):
    cache_key = f"github:{company_name}"
    cached = get_cached(cache_key)
    if cached:
        print("cache hit!")
        return cached
    
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    url = f"https://api.github.com/orgs/{company_name}/repos"
    response = requests.get(url, headers=headers)
    repos = response.json()
    
    signals = []
    for repo in repos:
        signals.append({
            "source": "github",
            "content": f"{repo['name']}: {repo['description']}",
            "url": repo['html_url'],
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
    signals = fetch_github_data("google")
    print(f"fetched {len(signals)} signals")
    
    print("\nSecond call:")
    signals = fetch_github_data("google")
    print(f"fetched {len(signals)} signals")

