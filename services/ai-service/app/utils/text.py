import re


def slugify_label(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")


def normalise_whitespace(value: str | None) -> str | None:
    if value is None:
        return None
    return " ".join(str(value).strip().split())


def mask_identifier(value: str | None) -> str | None:
    if not value:
        return value
    text = str(value)
    if len(text) <= 4:
        return "*" * len(text)
    return f"{text[:2]}{'*' * (len(text) - 4)}{text[-2:]}"
