"""
Central configuration for the dumbbell-form data pipeline.

Edit DATA_ROOT and the four dataset sub-paths to match where you unzipped/
cloned each source on your machine. Everything else (output paths, joint
definitions, dumbbell keyword filter) can stay as-is.
"""

import os

# ---------------------------------------------------------------------------
# 1. Root folder containing all raw datasets
# ---------------------------------------------------------------------------
# Absolute path to ml-services/data — works regardless of CWD.
# Override via the DATA_ROOT environment variable if needed.
_HERE = os.path.dirname(os.path.abspath(__file__))   # …/ml-services/dumbbell_form_pipeline
DATA_ROOT = os.environ.get("DATA_ROOT", os.path.join(_HERE, "..", "data"))

# ExerciseDB sample (the one you uploaded: gifs_180x180 / 360x360 / 1080x1080
# + bodyParts.json / equipments.json / exercises.json)
EXERCISEDB_DIR = os.path.join(DATA_ROOT, "exercisedb_v1_sample")
EXERCISEDB_GIF_SUBFOLDER = "gifs_360x360"   # good tradeoff of quality vs speed

# Exercise-Correction landmark CSVs, restructured under data/ to match the
# standard layout:  Exercise-Correction/<ExerciseName>/data/*.csv
EXERCISE_CORRECTION_REPO_DIR = os.path.join(DATA_ROOT, "Exercise-Correction")

# Kaggle "Exercise Detection dataset" (mrigaankjaswal) - precomputed angle CSVs
EXERCISE_DETECTION_DIR = os.path.join(DATA_ROOT, "exercise_detection_dataset")

# Kaggle yoga poses dataset (niharika41298) - only the plank class is used
YOGA_POSES_DIR = os.path.join(DATA_ROOT, "yoga_poses_dataset")
YOGA_PLANK_CLASS_NAME = "plank"   # matches the folder name inside the dataset

# ---------------------------------------------------------------------------
# 2. Output locations
# ---------------------------------------------------------------------------
OUTPUT_DIR = "./processed"
os.makedirs(OUTPUT_DIR, exist_ok=True)

EXERCISEDB_OUT = os.path.join(OUTPUT_DIR, "exercisedb_features.csv")
EXERCISE_CORRECTION_OUT = os.path.join(OUTPUT_DIR, "exercise_correction_features.csv")
EXERCISE_DETECTION_OUT = os.path.join(OUTPUT_DIR, "exercise_detection_features.csv")
YOGA_OUT = os.path.join(OUTPUT_DIR, "yoga_plank_features.csv")
MASTER_OUT = os.path.join(OUTPUT_DIR, "master_dataset.csv")

# ---------------------------------------------------------------------------
# 3. Exercise filtering
# ---------------------------------------------------------------------------
# ExerciseDB's exercises.json has an "equipments" list per exercise, e.g.
# ["dumbbell"], ["barbell"], ["body weight"]. We only want dumbbell work.
DUMBBELL_EQUIPMENT_TAGS = {"dumbbell"}

# ---------------------------------------------------------------------------
# 4. Pose landmark indices (MediaPipe Pose, 33-point model)
# ---------------------------------------------------------------------------
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_ELBOW, RIGHT_ELBOW = 13, 14
LEFT_WRIST, RIGHT_WRIST = 15, 16
LEFT_HIP, RIGHT_HIP = 23, 24
LEFT_KNEE, RIGHT_KNEE = 25, 26
LEFT_ANKLE, RIGHT_ANKLE = 27, 28

MIN_VISIBILITY = 0.5  # below this, a landmark is treated as unreliable
