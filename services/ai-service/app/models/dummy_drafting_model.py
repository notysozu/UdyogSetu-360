class DummyDraftingModel:
    model_name = "dummy_drafting_model"
    model_version = "0.1.0"

    def build_draft(self, draft_type: str, issue_summary: str | None, tone: str | None) -> str:
        summary = issue_summary or "the matter identified in the supplied case data"
        if draft_type == "query_to_investor":
            return (
                "Dear Applicant,\n\n"
                f"During scrutiny, we noted that {summary}. Kindly provide the required clarification or supporting document at the earliest so that processing may continue.\n\n"
                "Regards,\nDepartment Officer"
            )
        if draft_type == "rejection_reason":
            return (
                "The present record does not yet contain sufficient specific evidence for a final rejection note. "
                "Please review the underlying deficiency, cite the supporting record and confirm the exact corrective grounds before issuing any decision."
            )
        return f"Please review the following draft note regarding {summary}. This draft is advisory and must be checked by the responsible officer."
