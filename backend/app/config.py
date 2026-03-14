from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    groq_api_key: str = ""
    database_url: str = "postgresql+asyncpg://alignment:alignment123@localhost/alignmentdb"
    redis_url: str = "redis://localhost:6379"
    target_model: str = "llama-3.3-70b-versatile"
    judge_model: str = "llama-3.3-70b-versatile"
    concurrency: int = 3
    cache_ttl: int = 86400  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()
