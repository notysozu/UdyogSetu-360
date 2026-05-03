from __future__ import annotations

import argparse
import csv
import os


def generate_sample(path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["case_age_hours", "hours_since_last_activity", "queue_backlog_count", "adapter_failure_count", "label"],
        )
        writer.writeheader()
        writer.writerows(
            [
                {"case_age_hours": 24, "hours_since_last_activity": 2, "queue_backlog_count": 0, "adapter_failure_count": 0, "label": "low"},
                {"case_age_hours": 96, "hours_since_last_activity": 72, "queue_backlog_count": 40, "adapter_failure_count": 2, "label": "high"},
            ]
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build advisory training datasets without PII.")
    parser.add_argument("--generate-sample", action="store_true")
    parser.add_argument("--output", default="data/training/sample_sla.csv")
    args = parser.parse_args()
    if args.generate_sample:
        generate_sample(args.output)
        print(f"Sample dataset generated at {args.output}")
    else:
        print("Provide --generate-sample to write a synthetic non-PII training example.")
