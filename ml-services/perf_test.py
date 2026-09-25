import requests
import json
import time

BASE_URL = "http://localhost:8000/workouts" # Direct to FastAPI (after port 8000)

def test_performance():
    print("Testing ML Engine /recommend Performance...")
    payload = {
        "goal": "Build Muscle",
        "hardware": ["Dumbbell"],
        "experience": "Beginner",
        "target_muscles": ["Chest"]
    }
    
    start_time = time.time()
    try:
        res = requests.post(f"{BASE_URL}/recommend", json=payload, timeout=30)
        end_time = time.time()
        print(f"Status: {res.status_code}")
        print(f"Latency: {end_time - start_time:.4f} seconds")
        data = res.json()
        if data.get("success"):
            print(f"Mission: {data.get('mission_name')}")
            print(f"Protocol Steps: {len(data.get('protocol', []))}")
        else:
            print(f"Response: {data}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_performance()
