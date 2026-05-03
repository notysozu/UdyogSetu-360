class DummyNextActionModel:
    model_name = "dummy_next_action_model"
    model_version = "0.1.0"

    def prioritise(self, actions: list[dict], max_actions: int) -> list[dict]:
        priority_rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        return sorted(actions, key=lambda item: priority_rank.get(item.get("priority", "medium"), 9))[:max_actions]
