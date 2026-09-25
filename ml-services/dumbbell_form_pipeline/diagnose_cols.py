import pandas as pd
import config as cfg
import os

paths = {
    'BicepCurl': 'BicepCurl/data/train.csv',
    'Squat':     'Squat/data/train.csv',
    'Plank':     'Plank/data/train.csv',
    'Lunge':     'Lunge/data/err.train.csv',
}

needed = {
    'left_shoulder_x',  'right_shoulder_x',
    'left_elbow_x',     'right_elbow_x',
    'left_wrist_x',     'right_wrist_x',
    'left_hip_x',       'right_hip_x',
    'left_knee_x',      'right_knee_x',
    'left_ankle_x',     'right_ankle_x',
}

for ex, rel in paths.items():
    fp = os.path.join(cfg.EXERCISE_CORRECTION_REPO_DIR, rel)
    df = pd.read_csv(fp, nrows=1)
    cols = set(df.columns)
    missing = needed - cols
    present = needed & cols
    if missing:
        print(f"{ex}: MISSING -> {sorted(missing)}")
    else:
        print(f"{ex}: all required columns present")
