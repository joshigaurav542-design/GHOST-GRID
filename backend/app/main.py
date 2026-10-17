from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="GHOST GRID Simulation Engine",
    description="Deterministic Infrastructure Dependency Simulator & Cascade Modeling API",
    version="1.0.0",
)

# Enable CORS for local Vite development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "GHOST GRID Simulation Engine",
        "simulation_disclaimer": "SYNTHETIC FICTIONAL CAMPUS MODEL - FOR DEMO ONLY",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
