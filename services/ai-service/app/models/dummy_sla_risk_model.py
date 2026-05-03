from __future__ import annotations

from datetime import datetime, timezone


class DummySlaRiskModel:
    model_name = "dummy_sla_risk_model"
    model_version = "0.1.0"

    def score_task(self, task: dict, now: datetime) -> tuple[int, list[str]]:
        score = 10
        evidence: list[str] = []
        due_at = task.get("due_at")
        if due_at and due_at < now:
            score += 60
            evidence.append("Due date already passed.")
        elapsed = task.get("elapsed_percentage") or task.get("sla_elapsed_percentage")
        if elapsed is not None and elapsed >= 80:
            score += 25
            evidence.append("SLA consumption is above 80%.")
        last_activity_at = task.get("last_activity_at")
        if last_activity_at and (now - last_activity_at).total_seconds() / 3600 >= 48:
            score += 20
            evidence.append("No recent activity for 48+ hours.")
        if (task.get("query_count") or 0) > 0 and task.get("status") == "query_raised":
            score += 10
            evidence.append("Open query is awaiting response.")
        return min(100, score), evidence

    def predict(self, payload: dict) -> dict:
        now = datetime.now(timezone.utc)
        scored = []
        for task in payload.get("tasks", []):
            score, evidence = self.score_task(task, now)
            scored.append({"task": task, "score": score, "evidence": evidence})
        return {"scored_tasks": scored}
