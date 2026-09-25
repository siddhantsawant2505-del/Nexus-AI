"""
Merge the four per-source CSVs into a single master_dataset.csv.

Every source has already been converted into the same schema by its own
preprocess_*.py script, so this step is just a concat + a couple of sanity
checks/reports. Sources that haven't been run yet (missing CSV) are skipped
with a warning rather than crashing the whole pipeline.

Run:
    python build_master_dataset.py
"""

import os

import pandas as pd

import config as cfg

SOURCE_FILES = [
    ("ExerciseDB (dumbbell reference poses)", cfg.EXERCISEDB_OUT),
    ("Exercise-Correction repo (labeled form)", cfg.EXERCISE_CORRECTION_OUT),
    ("Exercise Detection dataset", cfg.EXERCISE_DETECTION_OUT),
    ("Yoga poses (plank only)", cfg.YOGA_OUT),
]


def main():
    frames = []
    for label, path in SOURCE_FILES:
        if os.path.exists(path):
            df = pd.read_csv(path)
            print(f"  [ok]   {label}: {len(df)} rows from {path}")
            frames.append(df)
        else:
            print(f"  [skip] {label}: {path} not found (run its preprocess_*.py first)")

    if not frames:
        print("Nothing to merge -- run at least one preprocess_*.py script first.")
        return

    master = pd.concat(frames, ignore_index=True)
    master.to_csv(cfg.MASTER_OUT, index=False)

    print(f"\nMaster dataset: {len(master)} rows -> {cfg.MASTER_OUT}")
    print("\nRows per source:")
    print(master["source"].value_counts())
    print("\nRows per exercise:")
    print(master["exercise_name"].value_counts())
    print("\nRows with a known form_label (usable for Track B, form classification):")
    print(master["form_label"].notna().sum(), "/", len(master))


if __name__ == "__main__":
    main()
