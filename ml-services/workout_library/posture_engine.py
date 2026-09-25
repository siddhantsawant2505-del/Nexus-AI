import math
from typing import Dict, List, Any, Tuple

def calculate_angle(a: Tuple[float, float], b: Tuple[float, float], c: Tuple[float, float]) -> float:
    """
    Calculates 2D angle at point B given points A, B, and C in degrees.
    """
    ang = math.degrees(
        math.atan2(c[1] - b[1], c[0] - b[0]) - math.atan2(a[1] - b[1], a[0] - b[0])
    )
    ang = abs(ang)
    if ang > 180:
        ang = 360 - ang
    return round(ang, 1)

def calculate_vertical_angle(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """
    Calculates angle of line segment AB relative to vertical line (0° = perfectly vertical).
    """
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    ang = math.degrees(math.atan2(abs(dx), abs(dy)))
    return round(ang, 1)

class PostureEngine:
    EXERCISES = {
        "squats": {
            "name": "Barbell / Bodyweight Squat",
            "primary_joints": ["knee", "hip", "ankle"],
            "target_depth_angle": 90, # Knee angle at bottom
            "recommended_view": "side",
            "tips": {
                "front": "Maintain shoulder-width stance, keep knees aligned over toes.",
                "side": "Hinge at hips, keep torso upright, lower until thighs are parallel to ground."
            }
        },
        "pushups": {
            "name": "Pushup Protocol",
            "primary_joints": ["elbow", "shoulder", "hip"],
            "target_depth_angle": 90, # Elbow angle at bottom
            "recommended_view": "side",
            "tips": {
                "front": "Hands slightly wider than shoulder width, keep core engaged.",
                "side": "Maintain straight body line from head to heels, lower chest to 90° elbow bend."
            }
        },
        "lunges": {
            "name": "Forward Lunge",
            "primary_joints": ["knee", "hip"],
            "target_depth_angle": 90,
            "recommended_view": "side",
            "tips": {
                "front": "Keep feet hip-width apart, prevent knee from collapsing inward.",
                "side": "Step forward, lower rear knee toward floor, maintain 90° bend in front knee."
            }
        },
        "bicep_curls": {
            "name": "Bicep Curl",
            "primary_joints": ["elbow", "shoulder"],
            "target_depth_angle": 45,
            "recommended_view": "front",
            "tips": {
                "front": "Pin elbows to torso, squeeze biceps at top, avoid swinging.",
                "side": "Keep upper arm stationary, perform full contraction and extension."
            }
        },
        "overhead_press": {
            "name": "Overhead Press",
            "primary_joints": ["elbow", "shoulder", "spine"],
            "target_depth_angle": 170, # Arm lockout at top
            "recommended_view": "front",
            "tips": {
                "front": "Press weights vertically overhead, lock out elbows without arching lower back.",
                "side": "Keep bar path in vertical alignment over mid-foot."
            }
        },
        "plank": {
            "name": "Isometric Core Plank",
            "primary_joints": ["spine", "hip", "shoulder"],
            "target_depth_angle": 180, # Straight body line
            "recommended_view": "side",
            "tips": {
                "front": "Distribute weight evenly on forearms, keep shoulders square.",
                "side": "Maintain a flat spine, do not let hips sag or pikes upward."
            }
        }
    }

    @classmethod
    def evaluate(cls, exercise: str, view_mode: str, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        """
        Evaluates pose landmarks for exercise and view mode.
        Returns posture score, joint angles, component metrics, and real-time form feedback.
        landmarks list format: list of dicts with 'x' (0-100) and 'y' (0-100)
        Index mapping standard (10 point simplified rig):
        0: Head, 1: L Shoulder, 2: R Shoulder, 3: L Elbow, 4: R Elbow,
        5: Hip Center, 6: L Knee, 7: R Knee, 8: L Foot, 9: R Foot
        """
        ex = exercise.lower().replace(" ", "_")
        if ex not in cls.EXERCISES:
            ex = "squats"

        # Default fallback coords if missing
        pts = {}
        for i, p in enumerate(landmarks):
            pts[i] = (p.get("x", 50), p.get("y", 50))

        # Fill defaults if landmarks < 10
        for i in range(10):
            if i not in pts:
                pts[i] = (50.0, 50.0 + i * 4)

        head = pts[0]
        l_shoulder, r_shoulder = pts[1], pts[2]
        l_elbow, r_elbow = pts[3], pts[4]
        hip = pts[5]
        l_knee, r_knee = pts[6], pts[7]
        l_foot, r_foot = pts[8], pts[9]

        feedback = []
        scores = {
            "overall": 90,
            "depth": 92,
            "stability": 88,
            "alignment": 90,
            "eccentric": 90
        }
        phase = "STANDING"
        joint_angles = {}

        if ex == "squats":
            # Knee angles
            l_knee_angle = calculate_angle(hip, l_knee, l_foot)
            r_knee_angle = calculate_angle(hip, r_knee, r_foot)
            avg_knee_angle = round((l_knee_angle + r_knee_angle) / 2, 1)

            # Torso lean angle relative to vertical
            torso_angle = calculate_vertical_angle(head, hip)

            joint_angles["knee_angle"] = avg_knee_angle
            joint_angles["torso_angle"] = torso_angle

            # Form evaluation based on View Mode
            if view_mode == "side":
                # Depth check
                if avg_knee_angle > 140:
                    phase = "STANDING"
                    scores["depth"] = 70
                    feedback.append("Initiate Squat: Bend knees and push hips back.")
                elif avg_knee_angle > 105:
                    phase = "ECCENTRIC"
                    scores["depth"] = 82
                    feedback.append("Continue lowering hips until thighs are parallel (target ~90°).")
                else:
                    phase = "BOTTOM_DEPTH"
                    scores["depth"] = 98
                    feedback.append("Optimal Squat Depth Reached! Drive upward through heels.")

                # Torso inclination check
                if torso_angle > 35:
                    scores["stability"] -= 20
                    feedback.append("WARNING: Excessive forward torso lean. Keep chest up.")
                else:
                    feedback.append("Torso angle stable.")

            else: # front view
                # Symmetry & stance check
                knee_diff = abs(l_knee_angle - r_knee_angle)
                stance_width = abs(r_foot[0] - l_foot[0])

                if knee_diff > 12:
                    scores["alignment"] -= 18
                    feedback.append("WARNING: Uneven weight distribution. Balance left/right leg power.")

                if stance_width < 15:
                    scores["alignment"] -= 10
                    feedback.append("Adjust stance: Move feet to shoulder width for better stability.")
                else:
                    feedback.append("Front view symmetry good.")

                if avg_knee_angle <= 100:
                    phase = "BOTTOM_DEPTH"

        elif ex == "pushups":
            l_elbow_angle = calculate_angle(l_shoulder, l_elbow, (l_elbow[0] - 10, l_elbow[1]))
            r_elbow_angle = calculate_angle(r_shoulder, r_elbow, (r_elbow[0] + 10, r_elbow[1]))
            avg_elbow_angle = round((l_elbow_angle + r_elbow_angle) / 2, 1)

            body_line_angle = calculate_vertical_angle(l_shoulder, l_foot)
            joint_angles["elbow_angle"] = avg_elbow_angle
            joint_angles["spine_line"] = body_line_angle

            if avg_elbow_angle > 130:
                phase = "TOP_LOCKOUT"
                scores["depth"] = 75
                feedback.append("Lower chest toward floor until elbows reach 90°.")
            else:
                phase = "CHEST_DEPTH"
                scores["depth"] = 96
                feedback.append("Great pushup depth! Press back up.")

            if body_line_angle > 80:
                feedback.append("Good horizontal plank alignment.")
            else:
                scores["stability"] -= 15
                feedback.append("Keep core tight, prevent hips from sagging.")

        elif ex == "bicep_curls":
            elbow_flex = calculate_angle(l_shoulder, l_elbow, l_foot)
            joint_angles["elbow_flexion"] = elbow_flex

            if elbow_flex < 60:
                phase = "PEAK_CONTRACTION"
                scores["depth"] = 98
                feedback.append("Peak Bicep Contraction! Squeeze and lower slowly.")
            else:
                phase = "EXTENSION"
                scores["depth"] = 80
                feedback.append("Curl weight upward without swinging shoulders.")

        else: # Default evaluation
            joint_angles["primary_angle"] = 90.0
            phase = "ACTIVE"
            feedback.append("Form tracking active. Maintain controlled tempo.")

        # Compute overall score
        scores["overall"] = round(
            (scores["depth"] * 0.4) + (scores["stability"] * 0.3) + (scores["alignment"] * 0.3)
        )

        return {
            "exercise": ex,
            "view_mode": view_mode,
            "phase": phase,
            "scores": scores,
            "joint_angles": joint_angles,
            "feedback": feedback,
            "confidence": 98.5
        }
