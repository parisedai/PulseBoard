import os
import sys

import requests
from dotenv import load_dotenv

sys.path.append("/Users/parinitasedai/Desktop/pulseboard/backend")
from db.database import SessionLocal
from db.models import Company, Signal
from services.cache import get_cached, set_cache

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")


def fetch_github_data(company_name):
    company_name = company_name.strip().lower()
    cache_key = f"github:{company_name}"
    cached = get_cached(cache_key)
    if cached:
        print("cache hit!")
        return cached

    if not GITHUB_TOKEN:
        raise RuntimeError("GITHUB_TOKEN is missing from the environment")

    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }

    repos = []
    org_url = f"https://api.github.com/orgs/{company_name}/repos"
    org_response = requests.get(org_url, headers=headers, timeout=20)

    if org_response.status_code == 200:
        repos = org_response.json()
    elif org_response.status_code in (404, 410):
        search_url = "https://api.github.com/search/repositories"
        params = {
            "q": f"{company_name} in:name",
            "sort": "updated",
            "order": "desc",
            "per_page": 10,
        }
        search_response = requests.get(search_url, headers=headers, params=params, timeout=20)
        if search_response.status_code != 200:
            print(f"GitHub search fallback failed for {company_name}: {search_response.status_code}")
            return []
        repos = search_response.json().get("items", [])
    else:
        raise RuntimeError(
            f"GitHub API error: {org_response.status_code} {org_response.text[:300]}"
        )

    if not isinstance(repos, list):
        return []

    signals = []
    for repo in repos:
        if not isinstance(repo, dict):
            continue
        name = repo.get("name") or repo.get("full_name") or "unknown"
        description = repo.get("description") or "No description available"
        html_url = repo.get("html_url") or ""
        signals.append({
            "source": "github",
            "content": f"{name}: {description}",
            "url": html_url,
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
    signals = fetch_github_data("google")
    save_signals("google", signals)

