from uuid import uuid4


CORRELATION_HEADER = "x-correlation-id"


def get_or_create_correlation_id(value: str | None) -> str:
    candidate = (value or "").strip()
    return candidate if candidate else str(uuid4())
