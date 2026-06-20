import os
from dotenv import load_dotenv
import anthropic
import sys
sys.path.append("/Users/parinitasedai/Desktop/pulseboard/backend")
from db.database import SessionLocal
from db.models import Signal, Company, Summary

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

def get_signals_for_company(company_name):
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.name == company_name).first()
        if not company:
            return []
        signals = db.query(Signal).filter(Signal.company_id == company.id).all()
        return signals
    finally:
        db.close()

def analyze_company(company_name):
    signals = get_signals_for_company(company_name)
    
    if not signals:
        return {"summary": "No data found for this company.", "sentiment": "neutral"}
    
    signal_text = "\n".join([f"[{s.source}] {s.content}" for s in signals])
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""You are an analyst helping job seekers prepare for interviews.
                
Here are recent signals about {company_name}:

{signal_text}

Please provide:
1. A 3-sentence summary of what this company is currently working on
2. Overall sentiment (positive/negative/neutral)

Format your response as:
SUMMARY: [your summary]
SENTIMENT: [positive/negative/neutral]"""
            }
        ]
    )
    
    response_text = message.content[0].text
    summary = response_text.split("SUMMARY:")[1].split("SENTIMENT:")[0].strip()
    sentiment = response_text.split("SENTIMENT:")[1].strip()
    
    return {"summary": summary, "sentiment": sentiment}

def save_summary(company_name, summary, sentiment):
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.name == company_name).first()
        if not company:
            return
        
        db_summary = Summary(
            company_id=company.id,
            summary_text=summary,
            sentiment=sentiment
        )
        db.add(db_summary)
        db.commit()
        print(f"Summary saved for {company_name}")
    finally:
        db.close()

if __name__ == "__main__":
    result = analyze_company("google")
    print("SUMMARY:", result["summary"])
    print("SENTIMENT:", result["sentiment"])
    save_summary("google", result["summary"], result["sentiment"])