import pandas as pd
import numpy as np
import random
import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class WorkoutEngine:
    def __init__(self, data_path: str = "data/exercisedb_v1_sample/exercises.json"):
        """
        Initializes the engine with the rich ExerciseDB dataset.
        """
        print(f"[ML-ENGINE] INITIALIZING_RECON_MATRIX... SOURCE: {data_path}")
        self.data_path = data_path
        self.df = self._load_data()
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self._initialize_matrix()
        print(f"[ML-ENGINE] NEURAL_GRID_STABLE. DATASET_SIZE: {len(self.df)}")
        
        # Mission Name Prefix/Suffix for 'Catchy' titles
        self.mission_presets = {
            "Build Muscle": ["IRON_FORGE", "HYPERTROPHY_ALPHA", "TITAN_PROTOCOL"],
            "Lose Fat": ["METABOLIC_SHRED", "THERMO_SYNC", "CALORIE_STORM"],
            "Strength": ["POWER_CORE", "HEAVY_LOAD", "STRENGTH_NUCLEUS"],
            "Full Body": ["TOTAL_RECON", "OMNI_SYNC", "KINETIC_FLOW"]
        }

    def _load_data(self):
        """
        Loads and normalizes the ExerciseDB JSON structure.
        """
        try:
            with open(self.data_path, 'r') as f:
                raw_data = json.load(f)
            
            # ExerciseDB uses 'targetMuscles' (list) instead of 'muscle' (string)
            # We normalize this for the Vectorizer
            normalized = []
            for ex in raw_data:
                normalized.append({
                    "id": ex.get("exerciseId", str(random.randint(1000, 9999))),
                    "name": ex.get("name", "Unknown Exercise"),
                    "muscle": " ".join(ex.get("targetMuscles", ["all"])),
                    "equipment": " ".join(ex.get("equipments", ["none"])),
                    "body_part": " ".join(ex.get("bodyParts", ["none"])),
                    "difficulty": ex.get("difficulty", "Medium"), # Dataset might lack this, we default to Medium
                    "instructions": "|".join(ex.get("instructions", [])),
                    "gif": ex.get("gifUrl", "")
                })
            
            return pd.DataFrame(normalized)
        except Exception as e:
            print(f"FAILED_DATA_LOAD: {e}")
            return pd.DataFrame(columns=['id', 'name', 'muscle', 'equipment', 'difficulty'])

    def _initialize_matrix(self):
        """
        Creates a 'Metadata Soup' and vectorizes the database.
        """
        if self.df.empty:
            self.matrix = None
            return

        # Combine key features into a single string for vectorization
        self.df['metadata_soup'] = (
            self.df['name'] + " " + 
            self.df['muscle'] + " " + 
            self.df['body_part'] + " " + 
            self.df['equipment']
        ).str.lower()

        self.matrix = self.vectorizer.fit_transform(self.df['metadata_soup'])

    def generate_catchy_name(self, goal: str):
        """
        Generates a high-fidelity mission name.
        """
        presets = self.mission_presets.get(goal, ["GENERIC_MISSION"])
        prefix = random.choice(presets)
        suffix = f"{random.randint(100, 999)}"
        return f"{prefix}_{suffix}"

    def recommend_workout(self, goal: str, hardware: list, level: str, target_muscles: list):
        """
        AI Recommendation: Matches user requirements against the ExerciseDB database.
        """
        print(f"[ML-RECO] CALCULATING_NEURAL_MATCH... goal={goal}, muscles={target_muscles}")
        
        if self.matrix is None or self.df.empty:
            print("[ML-RECO] Error: Matrix or database is empty.")
            return []

        # Construct hardware checking set
        hardware_set = {h.lower() for h in hardware}
        is_full_gym = "full gym" in hardware_set or "home gym" in hardware_set

        # Determine reps and sets based on experience level
        lvl = level.lower() if level else "beginner"
        if "beginner" in lvl:
            sets = 3
            reps = 12
            diff = "Easy"
        elif "intermediate" in lvl:
            sets = 4
            reps = 10
            diff = "Medium"
        elif "advanced" in lvl:
            sets = 4
            reps = 8
            diff = "Hard"
        else:
            sets = 5
            reps = 6
            diff = "Extreme"

        # Build query soup from input tags
        query_parts = []
        if target_muscles:
            query_parts.extend([m.lower() for m in target_muscles])
        if hardware:
            query_parts.extend([h.lower() for h in hardware])
        if goal:
            query_parts.append(goal.lower())
            if goal == "Build Muscle":
                query_parts.append("hypertrophy strength barbell dumbbell")
            elif goal == "Lose Fat":
                query_parts.append("cardio plyometrics fitness speed speed")
            elif goal == "Strength":
                query_parts.append("power heavy lift force")

        query_soup = " ".join(query_parts)
        query_vec = self.vectorizer.transform([query_soup])
        
        # Calculate cosine similarity
        sim_scores = cosine_similarity(query_vec, self.matrix).flatten()
        top_indices = np.argsort(sim_scores)[::-1]

        recommendations = []
        for idx in top_indices:
            if len(recommendations) >= 5:
                break
            
            score = sim_scores[idx]
            # Lower score threshold - if query is totally unrelated, we still match the best fit
            if score < 0.02 and len(recommendations) >= 2:
                break
                
            row = self.df.iloc[idx]
            
            # Apply hardware constraints
            ex_equip = row['equipment'].lower()
            if not is_full_gym:
                has_equip = False
                if ex_equip in ["bodyweight", "none", "", "all"]:
                    has_equip = True
                else:
                    for hw in hardware_set:
                        if hw in ex_equip or ex_equip in hw:
                            has_equip = True
                            break
                if not has_equip:
                    continue

            recommendations.append({
                "id": str(row["id"]),
                "name": row["name"].upper(),
                "reps": reps,
                "sets": sets,
                "difficulty": diff,
                "muscle": row["muscle"].title(),
                "match_score": round(float(score * 100) + 15.0, 1),  # Scaled for telemetry overlay feel
                "gif": row["gif"],
                "instructions": row["instructions"].split("|") if row["instructions"] else []
            })

        # Fallback in case filter was too aggressive
        if not recommendations:
            for idx in top_indices[:4]:
                row = self.df.iloc[idx]
                recommendations.append({
                    "id": str(row["id"]),
                    "name": row["name"].upper(),
                    "reps": reps,
                    "sets": sets,
                    "difficulty": diff,
                    "muscle": row["muscle"].title(),
                    "match_score": 45.0,
                    "gif": row["gif"],
                    "instructions": row["instructions"].split("|") if row["instructions"] else []
                })

        return recommendations

    def refine_workout(self, protocol: list, refine_scale: float):
        """
        Adaptive scaling based on user feedback.
        """
        # (Keeping same logic but ensuring it works with new ID/Format)
        refined = []
        for item in protocol:
            new_item = item.copy()
            if refine_scale <= 0.5:
                multiplier = 1 + (refine_scale * 2)
                new_item["reps"] = int(new_item["reps"] * multiplier)
            else:
                # Seek nearby harder variation
                variation = self._find_neural_progression(item)
                if variation:
                    new_item.update({
                        "id": str(variation["id"]),
                        "name": variation["name"].upper(),
                        "match_score": round(float(variation["sim"]), 1)
                    })
            refined.append(new_item)
        return refined

    def _find_neural_progression(self, current_item):
        """
        Similarity-based neighbor search for intensity jumps.
        """
        idx_match = self.df[self.df['id'] == current_item['id']].index
        if idx_match.empty: return None
        
        current_idx = idx_match[0]
        current_vec = self.matrix[current_idx]
        sim_scores = cosine_similarity(current_vec, self.matrix).flatten()
        neighbor_indices = np.argsort(sim_scores)[::-1]

        for idx in neighbor_indices:
            if idx == current_idx: continue
            candidate = self.df.iloc[idx]
            # In new dataset, we'll assume higher similarity with different keywords indicates a variation
            if sim_scores[idx] > 0.7:
                return {**candidate.to_dict(), "sim": sim_scores[idx] * 100}
        return None
