#!/usr/bin/env python3
"""Repository environment and file-layout checker for textbook-rag."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def check_files() -> tuple[bool, list[str]]:
    checks = [
        ("pyproject.toml", "Python project config", True),
        ("backend/api.py", "Backend API entrypoint", True),
        ("backend/app", "Backend source tree", True),
        ("backend/tests", "Backend test suite", True),
        ("frontend/package.json", "Frontend package config", True),
        ("frontend/src/main.tsx", "Frontend web entrypoint", True),
        ("textbooks/topic_index.json", "Textbook topic index", True),
        ("data/mineru_output", "Parsed textbook corpus", True),
        ("docs/reviews", "Phase review directory", True),
        ("docs/codemaps/frontend.md", "Frontend codemap", True),
        ("docs/test-report.md", "Testing report", True),
        ("coverage.json", "Coverage artifact", False),
    ]

    lines: list[str] = []
    success = True
    for relative_path, description, required in checks:
        full_path = PROJECT_ROOT / relative_path
        exists = full_path.exists()
        label = "PASS" if exists else ("FAIL" if required else "WARN")
        lines.append(f"{label:4} {relative_path:<32} {description}")
        if required and not exists:
            success = False
    return success, lines


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Check textbook-rag repository environment and required files."
    )
    parser.add_argument(
        "--files",
        action="store_true",
        help="Accepted for compatibility; file checks always run.",
    )
    _ = parser.parse_args()

    success, lines = check_files()
    print("=" * 60)
    print("Repository Environment Check")
    print("=" * 60)
    for line in lines:
        print(line)
    print("-" * 60)
    print("Result: PASS" if success else "Result: FAIL")
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
