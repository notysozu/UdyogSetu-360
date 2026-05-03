from __future__ import annotations

import argparse
import json
import os


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stub trainer for next action model.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", default="data/models/dummy_next_action_model.json")
    args = parser.parse_args()
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump({"model": "dummy_next_action_model", "input": args.input, "trained_at": None, "note": "Stub only. Use anonymised features."}, handle, indent=2)
    print(f"Stub metadata written to {args.output}")
