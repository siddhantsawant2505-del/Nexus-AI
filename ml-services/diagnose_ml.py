import requests
import json

BASE_URL = "http://localhost:8000/api/ml/workouts"

def test_recommend():
    print("Testing /recommend...")
    payload = {
        "goal": "Build Muscle",
        "hardware": ["Dumbbell"],
        "experience": "Beginner",
        "target_muscles": ["Chest"]
    }
    try:
        res = requests.post(f"{BASE_URL}/recommend", json=payload)
        print(f"Status: {res.status_code}")
        print(f"Response: {json.dumps(res.json(), indent=2)}")
    except Exception as e:
        print(f"FAILED: {e}")

def test_exercises():
    print("\nTesting /exercises...")
    try:
        res = requests.get(f"{BASE_URL}/exercises")
        print(f"Status: {res.status_code}")
        data = res.json()
        print(f"Exercises Found: {len(data.get('exercises', []))}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_recommend()
    test_exercises()
