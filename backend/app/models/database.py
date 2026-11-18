import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from sqlalchemy import Column, String, Float, DateTime, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

Base = declarative_base()
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class ResumeHistory(Base):
    __tablename__ = "resume_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    company_name = Column(String(255), default="Target Company")
    job_title = Column(String(255), default="Target Role")
    candidate_name = Column(String(255), default="Candidate")
    job_description = Column(Text, default="")
    
    original_ats_score = Column(Float, default=0.0)
    optimized_ats_score = Column(Float, default=0.0)
    
    docx_filename = Column(String(255), nullable=False)
    pdf_filename = Column(String(255), nullable=True)
    docx_path = Column(String(500), nullable=False)
    pdf_path = Column(String(500), nullable=True)
    
    matched_keywords_json = Column(Text, default="[]")
    missing_keywords_json = Column(Text, default="[]")
    changes_applied_json = Column(Text, default="[]")
    ats_analysis_json = Column(Text, default="{}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "company_name": self.company_name,
            "job_title": self.job_title,
            "candidate_name": self.candidate_name,
            "job_description_preview": (self.job_description[:160] + "...") if len(self.job_description) > 160 else self.job_description,
            "original_ats_score": round(self.original_ats_score, 1),
            "optimized_ats_score": round(self.optimized_ats_score, 1),
            "docx_filename": self.docx_filename,
            "pdf_filename": self.pdf_filename,
            "has_pdf": bool(self.pdf_path and Path(self.pdf_path).exists()) if hasattr(self, 'pdf_path') else False,
            "matched_keywords": json.loads(self.matched_keywords_json or "[]"),
            "missing_keywords": json.loads(self.missing_keywords_json or "[]"),
            "changes_applied": json.loads(self.changes_applied_json or "[]"),
            "ats_analysis": json.loads(self.ats_analysis_json or "{}")
        }


class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, default="")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


def init_db():
    from pathlib import Path
    Path(settings.DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
