from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, text
from sqlalchemy.ext.declarative import declarative_base
from pgvector.sqlalchemy import Vector
import datetime

Base = declarative_base()

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    url = Column(String, nullable=False)
    content = Column(String, nullable=False)
    source = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    embedding = Column(Vector(1536), nullable=True)

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    summary_text = Column(String, nullable=False)
    sentiment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)