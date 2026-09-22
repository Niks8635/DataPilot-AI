import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="allow")
    
    PROJECT_NAME: str = "DataPilot AI"
    TAGLINE: str = "Your data. Your questions. AI-powered answers."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "datapilot-ai-development-secret-key-32chars-minimum-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: Supports SQLite for zero-config local run, PostgreSQL / Supabase for production
    DATABASE_URL: str = "sqlite:///./datapilot.db"
    
    # Storage
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    MAX_UPLOAD_SIZE_MB: int = 100
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "https://datapilot-ai.vercel.app",
        "*"
    ]
    
    # Supabase (optional for hosted deployment)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None
    
    # AI Providers: "openai", "gemini", "anthropic", "auto", or fallback heuristic
    AI_PROVIDER: str = "auto"
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Sandbox configuration
    SANDBOX_TIMEOUT_SECONDS: int = 5

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
