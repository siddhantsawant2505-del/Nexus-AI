from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from workout_library.router import router as workout_router

app = FastAPI(title="NexusAI Intelligence Engine", version="4.0.0")

# Configure CORS for Node.js backend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Modular Routers
app.include_router(workout_router, prefix="/workouts", tags=["Workout_Library"])

@app.get("/health")
async def health_check():
    return {
        "status": "OPERATIONAL",
        "neural_link": "STABLE",
        "version": "4.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
