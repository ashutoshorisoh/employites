from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Skreener API"
    DEBUG: bool = False
    
    # Security / JWT
    JWT_SECRET: str = "#reqd key"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    OTP_EXPIRY_MINUTES: int = 10
    
    # Supabase DB Connection (PostgreSQL)
    DATABASE_URL: str = "#reqd key"
    SUPABASE_URL: str = "#reqd key"
    SUPABASE_KEY: str = "#reqd key"
    
    # Supabase Storage S3 Connection
    STORAGE_ACCESS_KEY_ID: str = "#reqd key"
    STORAGE_SECRET_ACCESS_KEY: str = "#reqd key"
    STORAGE_BUCKET_NAME: str = "#reqd key"
    STORAGE_ENDPOINT_URL: str = "#reqd key"
    STORAGE_REGION: str = "us-east-1"
    
    # Cloudflare R2 Storage (Compatibility Fallbacks)
    R2_ACCESS_KEY_ID: str = "#reqd key"
    R2_SECRET_ACCESS_KEY: str = "#reqd key"
    R2_BUCKET_NAME: str = "#reqd key"
    R2_ENDPOINT_URL: str = "#reqd key"
    
    # Gemini AI
    GEMINI_API_KEY: str = "#reqd key"

    # Resend Email Integration
    RESEND_API: str = "#reqd key"
    RESEND_FROM_EMAIL: str = "onboarding@resend.dev"
    # Paddle Webhook Settings
    PADDLE_PUBLIC_KEY: str = "#reqd key"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
