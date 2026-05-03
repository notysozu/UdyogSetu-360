from app.utils.scoring import clamp_score


class DummyRoutingModel:
    def recommend_approval_path(self, request) -> float:
        signals = [
            bool(request.project.power_requirement_kw and request.project.power_requirement_kw > 0),
            bool(request.project.fire_noc_required),
            bool(request.project.hazardous_process),
            bool(request.project.workers_count and request.project.workers_count >= 10),
        ]
        return clamp_score(0.55 + (sum(1 for signal in signals if signal) * 0.1))

    def calculate_delay_risk(self, request) -> float:
        score = 0.25
        score += 0.2 if request.document_summary.get("missingDocuments") else 0
        score += 0.2 if request.sla_summary.get("hasWarnings") else 0
        score += 0.2 if request.grievance_summary.get("openCount", 0) > 0 else 0
        score += 0.1 if len(request.current_tasks) >= 3 else 0
        return clamp_score(score)

    def suggest_next_best_actions(self, request) -> list[str]:
        actions = []
        if request.document_summary.get("missingDocuments"):
            actions.append("request_missing_documents")
        if request.project.fire_noc_required:
            actions.append("prepare_fire_track")
        if request.project.workers_count and request.project.workers_count >= 10:
            actions.append("prepare_labour_track")
        return actions or ["continue_scrutiny"]
