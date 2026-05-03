from app.rules.document_rules import DOCUMENT_TYPE_ALIASES
from app.utils.scoring import clamp_score


class DummyDocumentModel:
    def score_document_set(self, documents: list[str], required_documents: list[str]) -> float:
        if not required_documents:
            return 0.9
        covered = len(set(documents) & set(required_documents))
        return clamp_score(covered / max(len(required_documents), 1))

    def check_completeness(self, request, required_documents: list[str]) -> float:
        provided = [DOCUMENT_TYPE_ALIASES.get(doc.document_type.lower(), doc.document_type.lower()) for doc in request.provided_documents]
        return self.score_document_set(provided, required_documents)
