class DummyBottleneckModel:
    model_name = "dummy_bottleneck_model"
    model_version = "0.1.0"

    def detect(self, features: dict) -> list[dict]:
        bottlenecks = []
        if features.get("queue_backlog_count", 0) >= 20:
            bottlenecks.append(
                {
                    "bottleneck_type": "department_queue_backlog",
                    "severity": "high",
                    "bottleneck_score": min(100, 50 + int(features["queue_backlog_count"] / 2)),
                    "likely_cause": "Backlog is elevated in the operational queue.",
                    "recommended_action": "Review queue consumers and prioritise stale work items.",
                }
            )
        if features.get("adapter_failure_count", 0) > 0:
            bottlenecks.append(
                {
                    "bottleneck_type": "adapter_failure",
                    "severity": "high",
                    "bottleneck_score": min(100, 45 + features["adapter_failure_count"] * 8),
                    "likely_cause": "Recent department adapter failures are slowing progression.",
                    "recommended_action": "Check adapter runtime health and retry patterns.",
                }
            )
        if features.get("hours_since_last_activity", 0) >= 72:
            bottlenecks.append(
                {
                    "bottleneck_type": "no_activity",
                    "severity": "medium",
                    "bottleneck_score": 68,
                    "likely_cause": "Case progression appears stalled without recent movement.",
                    "recommended_action": "Reconfirm ownership and escalate if SLA is nearing breach.",
                }
            )
        return bottlenecks
