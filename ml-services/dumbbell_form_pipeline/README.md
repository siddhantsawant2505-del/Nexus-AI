# Dumbbell Form-Checker: Data Preprocessing Pipeline

Converts four heterogeneous data sources into one unified feature table
(`processed/master_dataset.csv`) of MediaPipe joint-angle features, ready
for the Track A / Track B model training discussed earlier.

## 1. Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Why mediapipe is pinned to 0.10.14**: mediapipe 0.10.30+ dropped the
legacy `mp.solutions.pose` API in favor of the newer Tasks API, which
needs a separately downloaded `.task` model file. 0.10.14 still ships the
old API with the model bundled in the pip package -- simpler, no extra
download step. This was verified working in this environment.

## 2. Expected folder layout

Place (or symlink) your four datasets under `./data/` like this:

```
data/
    exercisedb_v1_sample/          <- the one you already uploaded
        exercises.json
        gifs_360x360/*.gif
        ...
    Exercise-Correction/           <- git clone of NgoQuocBao1010/Exercise-Correction
        BicepCurl/data/*.csv
        Squat/data/*.csv
        Plank/data/*.csv
    exercise_detection_dataset/    <- Kaggle mrigaankjaswal/exercise-detection-dataset
        *.csv
    yoga_poses_dataset/            <- Kaggle niharika41298/yoga-poses-dataset
        TRAIN/plank/*.jpg
        TEST/plank/*.jpg
```

If your local folder names differ, edit the paths in `config.py` --
everything else references those constants, so that's the only file you
should need to touch for path issues.

## 3. Run

Run everything at once:
```bash
python run_pipeline.py
```

Or run/debug one source at a time (useful since you'll likely need to
tweak column names for the Exercise-Correction and Exercise Detection
scripts to match your actual downloaded files -- see the docstring at the
top of each script):
```bash
python preprocess_exercisedb.py          # verified working against your uploaded data
python preprocess_exercise_correction.py
python preprocess_exercise_detection.py
python preprocess_yoga.py
python build_master_dataset.py            # merges whatever's been generated so far
```

## 4. What you get

`processed/master_dataset.csv` -- one row per (source, exercise, frame),
with columns:

| Column | Meaning |
|---|---|
| `source` | which of the 4 datasets this row came from |
| `exercise_name` | normalized exercise label |
| `equipment` | dumbbell / body weight / etc. |
| `frame_idx` | frame number or filename within that clip/image |
| `form_label` | `None` for ExerciseDB (reference-only, no fault labels), `good`/fault-name where the source dataset actually has it |
| 12 angle/geometry features | `left_elbow_angle`, `right_elbow_angle`, `left_shoulder_angle`, `right_shoulder_angle`, `left_hip_angle`, `right_hip_angle`, `left_knee_angle`, `right_knee_angle`, `torso_lean_angle`, `elbow_symmetry_delta`, `knee_symmetry_delta`, `avg_visibility` |

## 5. Important limitation to flag in your report

**None of these four sources contain "good vs. bad dumbbell form" labels.**
- ExerciseDB gives clean *reference* trajectories (one idealized demo rep per exercise, dumbbell-filtered via the `equipments` field) -- 8 dumbbell exercises found in your sample, 65 frames extracted with pose detected.
- Exercise-Correction repo gives real labeled form data, but for body-weight exercises (bicep curl is its one dumbbell-adjacent exercise).
- Exercise Detection dataset and yoga poses are body-weight/static, no dumbbell coverage.

So this pipeline gets you a solid **Track A** (exercise-type recognition)
dataset and a set of **reference templates** for dumbbell exercises, but
**Track B (actual form-fault classification) still needs your own
self-recorded, deliberately-faulted footage** run through the same
`pose_utils.py` functions used here, to keep the feature schema identical
across everything.
