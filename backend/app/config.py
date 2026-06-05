from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Personalized Email Outreach Agent"
    
    DATABASE_URL: str = "sqlite:///./local.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    NVIDIA_NIM_API_KEY: str = ""
    NVIDIA_NIM_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    
    SECRET_KEY: str = "supersecretkey"  # Change in production
    ENCRYPTION_KEY: str = "" # Used for encrypting App Passwords (needs to be 32 bytes base64 encoded for Fernet)

    # Sending safeguards (PRD §21, §22, §26)
    MAX_EMAILS_PER_HOUR: int = 50
    MAX_EMAILS_PER_DAY: int = 400
    SMTP_RETRY_ATTEMPTS: int = 3
    AI_RETRY_ATTEMPTS: int = 3

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
