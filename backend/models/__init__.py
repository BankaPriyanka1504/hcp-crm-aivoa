from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hcp_name = Column(String(255), nullable=False, index=True)
    interaction_type = Column(String(100), default="Meeting")
    date = Column(String(20), nullable=False)
    time = Column(String(10), nullable=False)
    attendees = Column(Text, nullable=True)
    topics_discussed = Column(Text, nullable=True)
    materials_shared = Column(JSON, default=list)
    samples_distributed = Column(JSON, default=list)
    sentiment = Column(String(50), default="Neutral")
    outcomes = Column(Text, nullable=True)
    follow_up_actions = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    follow_up_suggestions = Column(JSON, default=list)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    specialty = Column(String(255), nullable=True)
    institution = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())