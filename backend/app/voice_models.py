from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from .database import Base


# Voice Inspection Logs Table (Additive audit table)
class VoiceInspectionLog(Base):
    __tablename__ = "voice_inspection_logs"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    return_id = Column(String(32), ForeignKey("returns.id"), nullable=True, index=True)
    raw_transcript = Column(Text, nullable=False)
    parsed_output_json = Column(Text, nullable=False)
    inspector_id = Column(String(64), default="tech_inspector_01")
    confidence_score = Column(Float, default=92.0)
    created_at = Column(DateTime, default=datetime.utcnow)
