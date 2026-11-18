import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
TEMPLATES_DIR = STORAGE_DIR / "templates"
RESUMES_DIR = STORAGE_DIR / "resumes"
PREVIEWS_DIR = STORAGE_DIR / "previews"

# Ensure directories exist
for directory in [STORAGE_DIR, TEMPLATES_DIR, RESUMES_DIR, PREVIEWS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "AI-Powered ATS Resume Builder"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Storage paths
    BASE_DIR: Path = BASE_DIR
    STORAGE_DIR: Path = STORAGE_DIR
    TEMPLATES_DIR: Path = TEMPLATES_DIR
    RESUMES_DIR: Path = RESUMES_DIR
    PREVIEWS_DIR: Path = PREVIEWS_DIR
    
    DEFAULT_TEMPLATE_PATH: Path = TEMPLATES_DIR / "master_resume.docx"
    DATABASE_PATH: Path = STORAGE_DIR / "resume_builder.db"
    DATABASE_URL: str = f"sqlite:///{DATABASE_PATH}"
    
    # AI settings
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")  # "gemini" or "openai"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Layout preservation thresholds
    # If text character count increases beyond 15%, flag potential layout overflow warning
    MAX_LENGTH_EXPANSION_THRESHOLD: float = float(os.getenv("MAX_LENGTH_EXPANSION_THRESHOLD", "0.15"))
    
    # Max upload file size in bytes (10MB)
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024

settings = Settings()
