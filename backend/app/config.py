from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    database_url: str = "postgresql+asyncpg://alignment:alignment123@localhost/alignmentdb"
    redis_url: str = "redis://localhost:6379"
    target_model: str = "claude-haiku-4-5-20251001"
    judge_model: str = "claude-haiku-4-5-20251001"
    concurrency: int = 5
    cache_ttl: int = 86400  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()
