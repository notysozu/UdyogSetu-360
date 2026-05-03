from __future__ import annotations

import argparse


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stub evaluator for advisory models.")
    parser.add_argument("--model", required=True)
    args = parser.parse_args()
    print(f"Model {args.model} is a deterministic starter model. No learned evaluation metrics are available yet.")
