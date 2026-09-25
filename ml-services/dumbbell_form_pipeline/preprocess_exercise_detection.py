"""
Preprocess the Kaggle "Exercise Detection dataset" (mrigaankjaswal).

This dataset ships CSVs with joint angles ALREADY computed per frame
(push-up, jumping-jack, pull-up), typically with columns like:
    exercise, frame, shoulder_angle, elbow_angle, hip_angle, knee_angle, label

Because it already provides angles rather than raw landmarks, this script
just renames/remaps its columns into our shared schema instead of running
MediaPipe again. CHECK THE COLUMN_MAP once you've opened your actual CSV --
the exact column names vary by dataset version.

Run:
    python preprocess_exercise_detection.py
"""

import glob
import os

import pandas as pd

import config as cfg
from pose_utils import FEATURE_COLUMNS

# Map from this dataset's column names -> our shared schema.
# INSPECT YOUR CSV HEADER FIRST and adjust the left-hand keys to match.
COLUMN_MAP = {
    "shoulder_angle": "left_shoulder_angle",
    "elbow_angle": "left_elbow_angle",
    "hip_angle": "left_hip_angle",
    "knee_angle": "left_knee_angle",
}


def main():
    csv_paths = glob.glob(os.path.join(cfg.EXERCISE_DETECTION_DIR, "**", "*.csv"), recursive=True)
    if not csv_paths:
        print(f"No CSVs found under {cfg.EXERCISE_DETECTION_DIR} -- check config.py")
        return

    all_rows = []
    for csv_path in csv_paths:
        df = pd.read_csv(csv_path)
        present_cols = {k: v for k, v in COLUMN_MAP.items() if k in df.columns}
        if not present_cols:
            print(f"  [warn] none of the expected angle columns found in {csv_path}. "
                  f"Actual columns: {list(df.columns)}")
            continue

        renamed = df.rename(columns=present_cols)
        renamed["source"] = "exercise_detection"
        renamed["exercise_name"] = df["exercise"] if "exercise" in df.columns else os.path.basename(csv_path)
        renamed["equipment"] = "body weight"
        renamed["exercise_id"] = None
        renamed["body_part"] = None
        renamed["frame_idx"] = df["frame"] if "frame" in df.columns else range(len(df))
        renamed["form_label"] = df["label"] if "label" in df.columns else None

        # Fill any missing feature columns (this dataset likely won't have all of them,
        # e.g. no wrist/ankle data -> no symmetry deltas) with NaN so the schema still matches.
        for col in FEATURE_COLUMNS:
            if col not in renamed.columns:
                renamed[col] = pd.NA

        all_rows.append(renamed[["source", "exercise_id", "exercise_name", "equipment",
                                  "body_part", "frame_idx", "form_label"] + FEATURE_COLUMNS])

    if not all_rows:
        print("No usable rows -- fix COLUMN_MAP to match your actual CSV headers.")
        return

    out_df = pd.concat(all_rows, ignore_index=True)
    out_df.to_csv(cfg.EXERCISE_DETECTION_OUT, index=False)
    print(f"Wrote {len(out_df)} rows -> {cfg.EXERCISE_DETECTION_OUT}")


if __name__ == "__main__":
    main()
