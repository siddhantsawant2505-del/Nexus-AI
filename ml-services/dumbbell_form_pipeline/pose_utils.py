"""
Shared MediaPipe pose extraction + angle feature engineering.

Every preprocessing script (ExerciseDB, Exercise-Correction repo, Exercise
Detection dataset, Yoga poses) funnels its frames through
`extract_landmarks()` and `feature_vector_from_landmarks()` so that all four
sources land in the exact same column schema.

NOTE ON MEDIAPIPE VERSION:
This uses the legacy `mp.solutions.pose` API, which needs
mediapipe==0.10.14 (or similar pre-0.10.30 release). Newer mediapipe
releases removed the bundled legacy model and switched to the Tasks API,
which requires downloading a .task model file at runtime. Pin the version
in requirements.txt to avoid that extra download step.
"""

import numpy as np
import mediapipe as mp

import config as cfg

mp_pose = mp.solutions.pose


def calculate_angle(a, b, c):
    """Angle at point b (in degrees), formed by points a-b-c."""
    a, b, c = np.array(a, dtype=float), np.array(b, dtype=float), np.array(c, dtype=float)
    ba = a - b
    bc = c - b
    denom = (np.linalg.norm(ba) * np.linalg.norm(bc)) + 1e-8
    cosine_angle = np.dot(ba, bc) / denom
    return float(np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0))))


def extract_landmarks(pose_detector, image_rgb):
    """
    Run MediaPipe Pose on a single RGB frame (numpy array, HxWx3).
    Returns a dict {landmark_index: (x, y, z, visibility)} in normalized
    [0,1] image coordinates, or None if no person was detected.
    """
    results = pose_detector.process(image_rgb)
    if not results.pose_landmarks:
        return None
    lm = results.pose_landmarks.landmark
    return {i: (p.x, p.y, p.z, p.visibility) for i, p in enumerate(lm)}


def _xy(landmarks, idx):
    return landmarks[idx][0], landmarks[idx][1]


def _visible(landmarks, idx):
    return landmarks[idx][3] >= cfg.MIN_VISIBILITY


def feature_vector_from_landmarks(landmarks):
    """
    Convert a raw landmark dict into a fixed-size feature vector (dict).
    Returns None if too many key joints are missing/occluded.
    """
    required = [
        cfg.LEFT_SHOULDER, cfg.RIGHT_SHOULDER, cfg.LEFT_ELBOW, cfg.RIGHT_ELBOW,
        cfg.LEFT_WRIST, cfg.RIGHT_WRIST, cfg.LEFT_HIP, cfg.RIGHT_HIP,
        cfg.LEFT_KNEE, cfg.RIGHT_KNEE, cfg.LEFT_ANKLE, cfg.RIGHT_ANKLE,
    ]
    visible_count = sum(1 for idx in required if idx in landmarks and _visible(landmarks, idx))
    if visible_count < len(required) * 0.7:
        return None  # too much of the body is occluded to trust this frame

    feats = {}

    # Elbow angles (shoulder-elbow-wrist) -> curl / press / row form
    feats["left_elbow_angle"] = calculate_angle(
        _xy(landmarks, cfg.LEFT_SHOULDER), _xy(landmarks, cfg.LEFT_ELBOW), _xy(landmarks, cfg.LEFT_WRIST))
    feats["right_elbow_angle"] = calculate_angle(
        _xy(landmarks, cfg.RIGHT_SHOULDER), _xy(landmarks, cfg.RIGHT_ELBOW), _xy(landmarks, cfg.RIGHT_WRIST))

    # Shoulder angles (elbow-shoulder-hip) -> lateral raise / press form
    feats["left_shoulder_angle"] = calculate_angle(
        _xy(landmarks, cfg.LEFT_ELBOW), _xy(landmarks, cfg.LEFT_SHOULDER), _xy(landmarks, cfg.LEFT_HIP))
    feats["right_shoulder_angle"] = calculate_angle(
        _xy(landmarks, cfg.RIGHT_ELBOW), _xy(landmarks, cfg.RIGHT_SHOULDER), _xy(landmarks, cfg.RIGHT_HIP))

    # Hip angles (shoulder-hip-knee) -> squat/deadlift back-lean, row torso angle
    feats["left_hip_angle"] = calculate_angle(
        _xy(landmarks, cfg.LEFT_SHOULDER), _xy(landmarks, cfg.LEFT_HIP), _xy(landmarks, cfg.LEFT_KNEE))
    feats["right_hip_angle"] = calculate_angle(
        _xy(landmarks, cfg.RIGHT_SHOULDER), _xy(landmarks, cfg.RIGHT_HIP), _xy(landmarks, cfg.RIGHT_KNEE))

    # Knee angles (hip-knee-ankle) -> squat depth
    feats["left_knee_angle"] = calculate_angle(
        _xy(landmarks, cfg.LEFT_HIP), _xy(landmarks, cfg.LEFT_KNEE), _xy(landmarks, cfg.LEFT_ANKLE))
    feats["right_knee_angle"] = calculate_angle(
        _xy(landmarks, cfg.RIGHT_HIP), _xy(landmarks, cfg.RIGHT_KNEE), _xy(landmarks, cfg.RIGHT_ANKLE))

    # Torso lean: angle of the hip-shoulder line relative to vertical
    mid_shoulder = np.mean([_xy(landmarks, cfg.LEFT_SHOULDER), _xy(landmarks, cfg.RIGHT_SHOULDER)], axis=0)
    mid_hip = np.mean([_xy(landmarks, cfg.LEFT_HIP), _xy(landmarks, cfg.RIGHT_HIP)], axis=0)
    dx, dy = mid_shoulder[0] - mid_hip[0], mid_shoulder[1] - mid_hip[1]
    feats["torso_lean_angle"] = float(np.degrees(np.arctan2(abs(dx), abs(dy) + 1e-8)))

    # Left-right symmetry deltas (large values suggest one-sided compensation)
    feats["elbow_symmetry_delta"] = abs(feats["left_elbow_angle"] - feats["right_elbow_angle"])
    feats["knee_symmetry_delta"] = abs(feats["left_knee_angle"] - feats["right_knee_angle"])

    feats["avg_visibility"] = float(np.mean([landmarks[idx][3] for idx in required if idx in landmarks]))

    return feats


FEATURE_COLUMNS = [
    "left_elbow_angle", "right_elbow_angle",
    "left_shoulder_angle", "right_shoulder_angle",
    "left_hip_angle", "right_hip_angle",
    "left_knee_angle", "right_knee_angle",
    "torso_lean_angle", "elbow_symmetry_delta", "knee_symmetry_delta",
    "avg_visibility",
]
