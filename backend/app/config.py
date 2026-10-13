from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App settings. Values come from environment variables or backend/.env."""

    database_url: str = "postgresql+psycopg://monitor:monitor@localhost:5432/monitor"
    api_key: str = "dev-agent-key"  # shared secret the agent sends in X-API-Key
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"  # comma-separated list
    offline_after_seconds: int = 30  # host counts as offline after this much silence
    retention_days: int = 7  # metrics older than this are deleted

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
