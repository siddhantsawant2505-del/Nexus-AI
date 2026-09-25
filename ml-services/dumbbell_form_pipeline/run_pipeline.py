"""
Run the full data preprocessing pipeline end-to-end.

Order matters: each preprocess_*.py can succeed or fail independently
(e.g. you might not have the Exercise-Correction repo checked out with
matching folder names yet) -- build_master_dataset.py just merges
whatever's available, so partial runs are fine while you're setting up.

Run:
    python run_pipeline.py
"""

import subprocess
import sys

STEPS = [
    "preprocess_exercisedb.py",
    "preprocess_exercise_correction.py",
    "preprocess_exercise_detection.py",
    "preprocess_yoga.py",
    "build_master_dataset.py",
]


def main():
    for step in STEPS:
        print(f"\n{'=' * 60}\nRunning {step}\n{'=' * 60}")
        result = subprocess.run([sys.executable, step])
        if result.returncode != 0:
            print(f"  [warn] {step} exited with code {result.returncode} -- continuing anyway")


if __name__ == "__main__":
    main()
