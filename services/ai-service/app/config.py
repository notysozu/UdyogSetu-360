import os
from functools import lru_cache
from typing import List

try:
    from pydantic import Field
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ModuleNotFoundError:  # pragma: no cover - runtime fallback when optional package is absent
    BaseSettings = object
    SettingsConfigDict = dict

    def Field(default=None, alias=None):  # noqa: N802
        return default


class Settings(BaseSettings):
    if BaseSettings is not object:
        model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "UdyogSetu 360 AI Service"
    environment: str = Field(default="development", alias="NODE_ENV")
    host: str = Field(default="0.0.0.0", alias="AI_SERVICE_HOST")
    port: int = Field(default=8000, alias="AI_SERVICE_PORT")
    log_level: str = Field(default="info", alias="AI_SERVICE_LOG_LEVEL")
    model_mode: str = Field(default="dummy", alias="AI_SERVICE_MODEL_MODE")
    confidence_threshold: float = Field(default=0.70, alias="AI_SERVICE_CONFIDENCE_THRESHOLD")
    uncertain_threshold: float = Field(default=0.50, alias="AI_SERVICE_UNCERTAIN_THRESHOLD")
    require_auth: bool = Field(default=False, alias="AI_SERVICE_REQUIRE_AUTH")
    api_key: str = Field(default="dev-ai-service-key", alias="AI_SERVICE_API_KEY")
    max_payload_size_mb: int = Field(default=5, alias="AI_SERVICE_MAX_PAYLOAD_SIZE_MB")
    advisory_enabled: bool = Field(default=True, alias="AI_ADVISORY_ENABLED")
    advisory_host: str = Field(default="0.0.0.0", alias="AI_ADVISORY_HOST")
    advisory_port: int = Field(default=8010, alias="AI_ADVISORY_PORT")
    advisory_base_url: str = Field(default="http://localhost:8010", alias="AI_ADVISORY_BASE_URL")
    advisory_timeout_ms: int = Field(default=5000, alias="AI_ADVISORY_TIMEOUT_MS")
    advisory_retries: int = Field(default=2, alias="AI_ADVISORY_RETRIES")
    advisory_require_auth: bool = Field(default=False, alias="AI_ADVISORY_REQUIRE_AUTH")
    advisory_api_key: str = Field(default="dev-ai-advisory-key", alias="AI_ADVISORY_API_KEY")
    advisory_model_mode: str = Field(default="dummy", alias="AI_ADVISORY_MODEL_MODE")
    advisory_log_level: str = Field(default="info", alias="AI_ADVISORY_LOG_LEVEL")
    advisory_confidence_threshold: float = Field(default=0.70, alias="AI_ADVISORY_CONFIDENCE_THRESHOLD")
    advisory_uncertain_threshold: float = Field(default=0.50, alias="AI_ADVISORY_UNCERTAIN_THRESHOLD")
    advisory_max_payload_size_mb: int = Field(default=5, alias="AI_ADVISORY_MAX_PAYLOAD_SIZE_MB")
    advisory_feedback_enabled: bool = Field(default=True, alias="AI_ADVISORY_FEEDBACK_ENABLED")
    advisory_safe_summary_max_chars: int = Field(default=1800, alias="AI_ADVISORY_SAFE_SUMMARY_MAX_CHARS")
    advisory_draft_max_chars: int = Field(default=1200, alias="AI_ADVISORY_DRAFT_MAX_CHARS")
    advisory_disable_freeform_llm: bool = Field(default=False, alias="AI_ADVISORY_DISABLE_FREEFORM_LLM")
    advisory_allow_dummy_mode: bool = Field(default=True, alias="AI_ADVISORY_ALLOW_DUMMY_MODE")
    allowed_origins_raw: str = Field(default="*", alias="CORS_ORIGINS")
    service_version: str = "1.0.0"

    def __init__(self, **kwargs):
        if BaseSettings is object:
            self.app_name = os.getenv("APP_NAME", self.app_name)
            self.environment = os.getenv("NODE_ENV", "development")
            self.host = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
            self.port = int(os.getenv("AI_SERVICE_PORT", "8000"))
            self.log_level = os.getenv("AI_SERVICE_LOG_LEVEL", "info")
            self.model_mode = os.getenv("AI_SERVICE_MODEL_MODE", "dummy")
            self.confidence_threshold = float(os.getenv("AI_SERVICE_CONFIDENCE_THRESHOLD", "0.70"))
            self.uncertain_threshold = float(os.getenv("AI_SERVICE_UNCERTAIN_THRESHOLD", "0.50"))
            self.require_auth = os.getenv("AI_SERVICE_REQUIRE_AUTH", "false").lower() == "true"
            self.api_key = os.getenv("AI_SERVICE_API_KEY", "dev-ai-service-key")
            self.max_payload_size_mb = int(os.getenv("AI_SERVICE_MAX_PAYLOAD_SIZE_MB", "5"))
            self.advisory_enabled = os.getenv("AI_ADVISORY_ENABLED", "true").lower() == "true"
            self.advisory_host = os.getenv("AI_ADVISORY_HOST", "0.0.0.0")
            self.advisory_port = int(os.getenv("AI_ADVISORY_PORT", "8010"))
            self.advisory_base_url = os.getenv("AI_ADVISORY_BASE_URL", "http://localhost:8010")
            self.advisory_timeout_ms = int(os.getenv("AI_ADVISORY_TIMEOUT_MS", "5000"))
            self.advisory_retries = int(os.getenv("AI_ADVISORY_RETRIES", "2"))
            self.advisory_require_auth = os.getenv("AI_ADVISORY_REQUIRE_AUTH", "false").lower() == "true"
            self.advisory_api_key = os.getenv("AI_ADVISORY_API_KEY", "dev-ai-advisory-key")
            self.advisory_model_mode = os.getenv("AI_ADVISORY_MODEL_MODE", "dummy")
            self.advisory_log_level = os.getenv("AI_ADVISORY_LOG_LEVEL", "info")
            self.advisory_confidence_threshold = float(os.getenv("AI_ADVISORY_CONFIDENCE_THRESHOLD", "0.70"))
            self.advisory_uncertain_threshold = float(os.getenv("AI_ADVISORY_UNCERTAIN_THRESHOLD", "0.50"))
            self.advisory_max_payload_size_mb = int(os.getenv("AI_ADVISORY_MAX_PAYLOAD_SIZE_MB", "5"))
            self.advisory_feedback_enabled = os.getenv("AI_ADVISORY_FEEDBACK_ENABLED", "true").lower() == "true"
            self.advisory_safe_summary_max_chars = int(os.getenv("AI_ADVISORY_SAFE_SUMMARY_MAX_CHARS", "1800"))
            self.advisory_draft_max_chars = int(os.getenv("AI_ADVISORY_DRAFT_MAX_CHARS", "1200"))
            self.advisory_disable_freeform_llm = os.getenv("AI_ADVISORY_DISABLE_FREEFORM_LLM", "false").lower() == "true"
            self.advisory_allow_dummy_mode = os.getenv("AI_ADVISORY_ALLOW_DUMMY_MODE", "true").lower() == "true"
            self.allowed_origins_raw = os.getenv("CORS_ORIGINS", "*")
            self.service_version = "1.0.0"
        else:
            super().__init__(**kwargs)

    @property
    def allowed_origins(self) -> List[str]:
        raw = self.allowed_origins_raw.strip()
        if not raw:
            return ["*"]
        return [item.strip() for item in raw.split(",") if item.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
