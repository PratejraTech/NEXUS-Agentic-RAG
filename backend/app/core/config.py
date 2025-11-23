from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    API_KEY: str = "default_api_key"
    POSTGRES_URI: str = "postgresql://user:password@postgres:5432/nexus"
    MEMGRAPH_URI: str = "bolt://memgraph:7687"
    MEMGRAPH_USER: str = "admin"
    MEMGRAPH_PASSWORD: str = "nexus_graph_secret"
    CHROMA_HOST: str = "chromadb"
    CHROMA_PORT: int = 8000

    # LLM
    GOOGLE_API_KEY: Optional[str] = None

    # App
    PROJECT_NAME: str = "Nexus Backend"
    API_V1_STR: str = "/api"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
