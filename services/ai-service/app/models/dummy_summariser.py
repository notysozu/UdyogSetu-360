class DummySummariser:
    model_name = "dummy_summariser"
    model_version = "0.1.0"

    def summarise(self, parts: list[str], max_chars: int) -> str:
        text = " ".join([part.strip() for part in parts if part and part.strip()])
        return text[: max_chars - 1].rstrip() + ("…" if len(text) > max_chars else "")
