"""
Preprocess the Exercise-Correction landmark CSVs.

Expected layout under EXERCISE_CORRECTION_REPO_DIR (config.py):

    Exercise-Correction/
        BicepCurl/
            data/
                train.csv   <- landmark coords (left_shoulder_x style) + "label" column
                test.csv
        Squat/
            data/
                train.csv
                test.csv
        Plank/
            data/
                train.csv
                test.csv
        Lunge/
            data/
                err.train.csv    <- error classification (C/L labels)
                err.test.csv
                stage.train.csv  <- stage classification (M/D/I labels)
                stage.test.csv

Each CSV row is one frame with 33 MediaPipe landmark coordinates.
Column names follow the named convention: left_shoulder_x, left_shoulder_y,
left_shoulder_z, left_shoulder_v (visibility).

This script auto-detects the column convention in use:
  - Named:   "left_shoulder_x", "right_elbow_y", etc.
  - Indexed: "11_x", "14_y", etc.  (original MediaPipe index prefix style)

Run:
    python preprocess_exercise_correction.py
"""

import glob
import os

import numpy as np
import pandas as pd

import config as cfg
from pose_utils import calculate_angle, FEATURE_COLUMNS

# ---------------------------------------------------------------------------
# Exercise → (glob pattern for CSVs, label column name)
# Patterns are relative to EXERCISE_CORRECTION_REPO_DIR.
# ---------------------------------------------------------------------------
EXERCISE_CSV_MAP = {
    "BicepCurl": [("BicepCurl/data/*.csv", "label")],
    "Squat":     [("Squat/data/*.csv",     "label")],
    "Plank":     [("Plank/data/*.csv",     "label")],
    # Lunge has two separate label tasks; both are included
    "Lunge":     [
        ("Lunge/data/err.*.csv",   "label"),   # error classification (C / L)
        ("Lunge/data/stage.*.csv", "label"),   # stage classification  (M / D / I)
    ],
}

# ---------------------------------------------------------------------------
# Named-landmark lookup table  (MediaPipe index → human-readable name prefix)
# ---------------------------------------------------------------------------
_IDX_TO_NAME = {
    11: "left_shoulder",
    12: "right_shoulder",
    13: "left_elbow",
    14: "right_elbow",
    15: "left_wrist",
    16: "right_wrist",
    23: "left_hip",
    24: "right_hip",
    25: "left_knee",
    26: "right_knee",
    27: "left_ankle",
    28: "right_ankle",
}

_AXIS_MAP = {"x": "x", "y": "y", "z": "z", "v": "v"}


def _detect_convention(df_columns):
    """Return 'named' if columns follow left_shoulder_x style, 'indexed' for 11_x style."""
    for col in df_columns:
        if col.startswith("left_") or col.startswith("right_"):
            return "named"
        if "_x" in col and col.split("_")[0].isdigit():
            return "indexed"
    return "named"  # default fallback


def _col(idx: int, axis: str, convention: str) -> str:
    """Return the column name for a landmark index + axis given the active convention."""
    if convention == "named":
        return f"{_IDX_TO_NAME[idx]}_{axis}"
    else:  # indexed
        return f"{idx}_{axis}"


def _safe_pt(row, idx: int, convention: str):
    """Return (x, y) for landmark idx, or None if columns are absent."""
    x_col = _col(idx, "x", convention)
    y_col = _col(idx, "y", convention)
    if x_col not in row.index or y_col not in row.index:
        return None
    return row[x_col], row[y_col]


def _safe_angle(a, b, c):
    """Return angle or NaN if any point is None (landmark absent in CSV)."""
    if a is None or b is None or c is None:
        return float("nan")
    return calculate_angle(a, b, c)


def angles_from_row(row, convention: str):
    """Extract joint-angle feature vector from a single landmark CSV row.

    Joints that are absent in the CSV (e.g. no knee/ankle for BicepCurl,
    no elbow/wrist for Squat/Lunge) are filled with NaN rather than
    raising KeyError so every row is kept.
    """
    def pt(idx):
        return _safe_pt(row, idx, convention)

    feats = {}
    feats["left_elbow_angle"]     = _safe_angle(pt(cfg.LEFT_SHOULDER),  pt(cfg.LEFT_ELBOW),    pt(cfg.LEFT_WRIST))
    feats["right_elbow_angle"]    = _safe_angle(pt(cfg.RIGHT_SHOULDER), pt(cfg.RIGHT_ELBOW),   pt(cfg.RIGHT_WRIST))
    feats["left_shoulder_angle"]  = _safe_angle(pt(cfg.LEFT_ELBOW),     pt(cfg.LEFT_SHOULDER), pt(cfg.LEFT_HIP))
    feats["right_shoulder_angle"] = _safe_angle(pt(cfg.RIGHT_ELBOW),    pt(cfg.RIGHT_SHOULDER),pt(cfg.RIGHT_HIP))
    feats["left_hip_angle"]       = _safe_angle(pt(cfg.LEFT_SHOULDER),  pt(cfg.LEFT_HIP),      pt(cfg.LEFT_KNEE))
    feats["right_hip_angle"]      = _safe_angle(pt(cfg.RIGHT_SHOULDER), pt(cfg.RIGHT_HIP),     pt(cfg.RIGHT_KNEE))
    feats["left_knee_angle"]      = _safe_angle(pt(cfg.LEFT_HIP),       pt(cfg.LEFT_KNEE),     pt(cfg.LEFT_ANKLE))
    feats["right_knee_angle"]     = _safe_angle(pt(cfg.RIGHT_HIP),      pt(cfg.RIGHT_KNEE),    pt(cfg.RIGHT_ANKLE))

    # Torso lean: angle of the spine vector from vertical.
    # Requires shoulder + hip landmarks — NaN if absent.
    try:
        ls_x = row[_col(cfg.LEFT_SHOULDER,  "x", convention)]
        rs_x = row[_col(cfg.RIGHT_SHOULDER, "x", convention)]
        ls_y = row[_col(cfg.LEFT_SHOULDER,  "y", convention)]
        rs_y = row[_col(cfg.RIGHT_SHOULDER, "y", convention)]
        lh_x = row[_col(cfg.LEFT_HIP,       "x", convention)]
        rh_x = row[_col(cfg.RIGHT_HIP,      "x", convention)]
        lh_y = row[_col(cfg.LEFT_HIP,       "y", convention)]
        rh_y = row[_col(cfg.RIGHT_HIP,      "y", convention)]
        dx = (ls_x + rs_x) / 2 - (lh_x + rh_x) / 2
        dy = (ls_y + rs_y) / 2 - (lh_y + rh_y) / 2
        feats["torso_lean_angle"] = float(np.degrees(np.arctan2(abs(dx), abs(dy) + 1e-8)))
    except KeyError:
        feats["torso_lean_angle"] = float("nan")

    # Symmetry deltas — NaN-safe (NaN - NaN = NaN, abs(NaN) = NaN)
    feats["elbow_symmetry_delta"] = abs(feats["left_elbow_angle"] - feats["right_elbow_angle"])
    feats["knee_symmetry_delta"]  = abs(feats["left_knee_angle"]  - feats["right_knee_angle"])

    # Average visibility of whichever key landmarks are present in this CSV
    vis_indices = [
        cfg.LEFT_SHOULDER, cfg.RIGHT_SHOULDER,
        cfg.LEFT_ELBOW,    cfg.RIGHT_ELBOW,
        cfg.LEFT_WRIST,    cfg.RIGHT_WRIST,
        cfg.LEFT_HIP,      cfg.RIGHT_HIP,
        cfg.LEFT_KNEE,     cfg.RIGHT_KNEE,
        cfg.LEFT_ANKLE,    cfg.RIGHT_ANKLE,
    ]
    vis_cols = [_col(i, "v", convention) for i in vis_indices
                if _col(i, "v", convention) in row.index]
    feats["avg_visibility"] = float(row[vis_cols].mean()) if vis_cols else 1.0

    return feats


def main():
    all_rows = []

    for exercise_name, pattern_list in EXERCISE_CSV_MAP.items():
        for (pattern, label_col) in pattern_list:
            csv_paths = glob.glob(
                os.path.join(cfg.EXERCISE_CORRECTION_REPO_DIR, pattern)
            )
            if not csv_paths:
                print(f"  [skip] no CSVs matched: {pattern}")
                continue

            for csv_path in csv_paths:
                df = pd.read_csv(csv_path)

                if label_col not in df.columns:
                    print(
                        f"  [warn] '{label_col}' not found in {csv_path}\n"
                        f"         columns present: {list(df.columns)[:10]}..."
                    )
                    continue

                convention = _detect_convention(df.columns)
                print(f"  Processing {os.path.relpath(csv_path, cfg.EXERCISE_CORRECTION_REPO_DIR)}"
                      f"  ({len(df)} rows, convention='{convention}')")

                for _, row in df.iterrows():
                    feats = angles_from_row(row, convention)

                    out_row = {
                        "source":        "exercise_correction",
                        "exercise_id":   None,
                        "exercise_name": exercise_name.lower(),
                        "equipment":     "dumbbell" if exercise_name == "BicepCurl" else "body weight",
                        "body_part":     None,
                        "frame_idx":     None,
                        "form_label":    row[label_col],
                    }
                    out_row.update(feats)
                    all_rows.append(out_row)

    if not all_rows:
        print(
            "No rows extracted.\n"
            "Check EXERCISE_CORRECTION_REPO_DIR in config.py and EXERCISE_CSV_MAP above\n"
            "against your actual folder structure."
        )
        return

    out_df = pd.DataFrame(all_rows)
    cols = ["source", "exercise_id", "exercise_name", "equipment", "body_part",
            "frame_idx", "form_label"] + FEATURE_COLUMNS
    out_df = out_df[cols]
    out_df.to_csv(cfg.EXERCISE_CORRECTION_OUT, index=False)
    print(f"\nWrote {len(out_df)} rows -> {cfg.EXERCISE_CORRECTION_OUT}")
    print(f"  Exercises: {sorted(out_df['exercise_name'].unique())}")
    print(f"  Labels   : {sorted(out_df['form_label'].unique())}")


if __name__ == "__main__":
    main()
