"""
Preprocess the Kaggle yoga poses dataset -- PLANK CLASS ONLY.

The other yoga poses (downdog, goddess, tree, warrior2) aren't relevant to
a dumbbell workout app, so we filter to just the plank folder. Expected
layout (standard Kaggle image-classification format):

    yoga_poses_dataset/
        TRAIN/
            plank/*.jpg
            downdog/*.jpg
            ...
        TEST/
            plank/*.jpg
            ...

Run:
    python preprocess_yoga.py
"""

import glob
import os

import cv2
import pandas as pd
from tqdm import tqdm
import mediapipe as mp

import config as cfg
from pose_utils import extract_landmarks, feature_vector_from_landmarks, FEATURE_COLUMNS

mp_pose = mp.solutions.pose


def find_plank_images():
    pattern = os.path.join(cfg.YOGA_POSES_DIR, "**", cfg.YOGA_PLANK_CLASS_NAME, "*")
    paths = glob.glob(pattern, recursive=True)
    image_paths = [p for p in paths if p.lower().endswith((".jpg", ".jpeg", ".png"))]
    print(f"Found {len(image_paths)} plank images.")
    return image_paths


def main():
    image_paths = find_plank_images()
    if not image_paths:
        print(f"No plank images found under {cfg.YOGA_POSES_DIR} -- check config.py "
              f"(folder layout / YOGA_PLANK_CLASS_NAME)")
        return

    rows = []
    with mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5) as pose_detector:
        for img_path in tqdm(image_paths, desc="Extracting plank poses"):
            frame_bgr = cv2.imread(img_path)
            if frame_bgr is None:
                continue
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

            landmarks = extract_landmarks(pose_detector, frame_rgb)
            if landmarks is None:
                continue
            feats = feature_vector_from_landmarks(landmarks)
            if feats is None:
                continue

            row = {
                "source": "yoga_dataset",
                "exercise_id": None,
                "exercise_name": "plank",
                "equipment": "body weight",
                "body_part": "core",
                "frame_idx": os.path.basename(img_path),
                # Every image here is a static "reference hold" pose -- treat as good form
                # unless you manually curate a bad-form subset.
                "form_label": "good",
            }
            row.update(feats)
            rows.append(row)

    if not rows:
        print("No rows extracted.")
        return

    out_df = pd.DataFrame(rows)
    cols = ["source", "exercise_id", "exercise_name", "equipment", "body_part",
            "frame_idx", "form_label"] + FEATURE_COLUMNS
    out_df = out_df[cols]
    out_df.to_csv(cfg.YOGA_OUT, index=False)
    print(f"Wrote {len(out_df)} rows -> {cfg.YOGA_OUT}")


if __name__ == "__main__":
    main()
