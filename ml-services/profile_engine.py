import time
import json
import pandas as pd
from workout_library.engine import WorkoutEngine

def profile_engine():
    data_path = "data/exercisedb_v1_sample/exercises.json"
    
    print(f"Profiling WorkoutEngine with {data_path}...")
    
    start = time.time()
    engine = WorkoutEngine(data_path)
    print(f"Initialization (Load + TF-IDF) Time: {time.time() - start:.4f}s")
    
    start = time.time()
    protocol = engine.recommend_workout(
        goal="Build Muscle",
        hardware=["Dumbbell", "Barbell"],
        level="Intermediate",
        target_muscles=["Chest", "Shoulders"]
    )
    print(f"Recommend Workout Time: {time.time() - start:.4f}s")
    print(f"Result count: {len(protocol)}")

if __name__ == "__main__":
    profile_engine()
