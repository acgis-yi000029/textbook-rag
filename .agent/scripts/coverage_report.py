#!/usr/bin/env python3
"""Coverage helper for textbook-rag."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
COVERAGE_FILE = PROJECT_ROOT / "coverage.json"


def run_backend_coverage() -> dict | None:
    cmd = [
        "uv",
        "run",
        "pytest",
        "backend/tests",
        "--cov=backend.app",
        "--cov-report=json:coverage.json",
        "-q",
        "--basetemp=backend/.pytest-tmp-review",
    ]
    result = subprocess.run(
        cmd,
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("WARN backend coverage command failed")
        if result.stdout:
            print(result.stdout.strip())
        if result.stderr:
            print(result.stderr.strip())
        return None
    return load_coverage_file()


def load_coverage_file() -> dict | None:
    if not COVERAGE_FILE.exists():
        return None
    with COVERAGE_FILE.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def parse_backend_coverage(data: dict) -> float:
    totals = data.get("totals", {})
    return float(totals.get("percent_covered", 0.0))


def main() -> None:
    parser = argparse.ArgumentParser(description="Report backend coverage.")
    parser.add_argument("--backend", action="store_true", help="Kept for compatibility.")
    parser.add_argument(
        "--threshold",
        "-t",
        type=float,
        default=0.0,
        help="Minimum acceptable backend coverage percentage.",
    )
    args = parser.parse_args()

    data = load_coverage_file()
    source = "existing coverage.json"
    if data is None:
        data = run_backend_coverage()
        source = "fresh pytest run"

    if data is None:
        print("FAIL no backend coverage data available")
        sys.exit(1)

    backend_lines = parse_backend_coverage(data)
    print("=" * 60)
    print("Coverage Report")
    print("=" * 60)
    print(f"Source: {source}")
    print(f"Backend lines: {backend_lines:.1f}%")

    if args.threshold > 0:
        if backend_lines < args.threshold:
            print(f"Result: FAIL ({backend_lines:.1f}% < {args.threshold:.1f}%)")
            sys.exit(1)
        print(f"Result: PASS ({backend_lines:.1f}% >= {args.threshold:.1f}%)")
    else:
        print("Result: PASS")


if __name__ == "__main__":
    main()
