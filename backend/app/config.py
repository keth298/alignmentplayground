from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    groq_api_key: str = ""
    firebase_credentials_path: str = "firebase-credentials.json"
    firebase_project_id: str = ""
    target_model: str = "llama-3.3-70b-versatile"
    judge_model: str = "llama-3.3-70b-versatile"
    concurrency: int = 3
    cache_ttl: int = 86400  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()
