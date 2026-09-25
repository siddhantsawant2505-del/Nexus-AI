"""
Preprocess the ExerciseDB sample (data/exercisedb_v1_sample).

What this does:
1. Loads exercises.json
2. Filters to exercises whose "equipments" list includes "dumbbell"
3. For each matching exercise's GIF, extracts every frame
4. Runs MediaPipe Pose on each frame -> joint-angle feature vector
5. Writes one row per (exercise, frame) to processed/exercisedb_features.csv

This gives you a *reference/canonical* pose trajectory per dumbbell
exercise (the GIFs show one idealized demo rep, not user attempts with
faults) -- useful for Track A (exercise-type recognition) and as a
template to compare a live user's angles against, but it is NOT a
source of "bad form" labels. That still has to come from your own
self-recorded footage.

Run:
    python preprocess_exercisedb.py
"""

import json
import os

import numpy as np
import pandas as pd
from PIL import Image
from tqdm import tqdm
import mediapipe as mp

import config as cfg
from pose_utils import extract_landmarks, feature_vector_from_landmarks, FEATURE_COLUMNS

mp_pose = mp.solutions.pose


def load_dumbbell_exercises():
    meta_path = os.path.join(cfg.EXERCISEDB_DIR, "exercises.json")
    with open(meta_path, "r") as f:
        exercises = json.load(f)

    dumbbell_exercises = [
        e for e in exercises
        if cfg.DUMBBELL_EQUIPMENT_TAGS & set(eq.lower() for eq in e.get("equipments", []))
    ]
    print(f"Loaded {len(exercises)} total exercises, "
          f"{len(dumbbell_exercises)} tagged with dumbbell equipment.")
    return dumbbell_exercises


def iter_gif_frames(gif_path):
    im = Image.open(gif_path)
    for frame_idx in range(im.n_frames):
        im.seek(frame_idx)
        yield frame_idx, np.array(im.convert("RGB"))


def process_exercise(exercise, pose_detector):
    gif_name = exercise["gifUrl"]
    gif_path = os.path.join(cfg.EXERCISEDB_DIR, cfg.EXERCISEDB_GIF_SUBFOLDER, gif_name)
    if not os.path.exists(gif_path):
        print(f"  [skip] GIF not found: {gif_path}")
        return []

    rows = []
    for frame_idx, frame_rgb in iter_gif_frames(gif_path):
        landmarks = extract_landmarks(pose_detector, frame_rgb)
        if landmarks is None:
            continue
        feats = feature_vector_from_landmarks(landmarks)
        if feats is None:
            continue

        row = {
            "source": "exercisedb",
            "exercise_id": exercise["exerciseId"],
            "exercise_name": exercise["name"],
            "equipment": ",".join(exercise.get("equipments", [])),
            "body_part": ",".join(exercise.get("bodyParts", [])),
            "frame_idx": frame_idx,
            "form_label": None,  # ExerciseDB has no fault labels -- reference only
        }
        row.update(feats)
        rows.append(row)
    return rows


def main():
    exercises = load_dumbbell_exercises()
    all_rows = []

    with mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5) as pose_detector:
        for exercise in tqdm(exercises, desc="Extracting dumbbell exercise poses"):
            all_rows.extend(process_exercise(exercise, pose_detector))

    if not all_rows:
        print("No rows extracted -- check EXERCISEDB_DIR / EXERCISEDB_GIF_SUBFOLDER in config.py")
        return

    df = pd.DataFrame(all_rows)
    cols = ["source", "exercise_id", "exercise_name", "equipment", "body_part",
            "frame_idx", "form_label"] + FEATURE_COLUMNS
    df = df[cols]
    df.to_csv(cfg.EXERCISEDB_OUT, index=False)
    print(f"Wrote {len(df)} rows -> {cfg.EXERCISEDB_OUT}")
    print(f"Covered {df['exercise_name'].nunique()} distinct dumbbell exercises.")


if __name__ == "__main__":
    main()
