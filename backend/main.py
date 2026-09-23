import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.data_loader import load_all

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load all data on startup and cache it in app.state
    logger.info("Loading CSV data into memory...")
    app.state.data = load_all()
    logger.info("Application started and data loaded successfully.")
    yield
    # Cleanup on shutdown (if needed)
    logger.info("Application shutdown.")

app = FastAPI(title="CAT Operator AI Companion API", lifespan=lifespan)

@app.get("/health")
def health_check():
    return {"status": "ok"}

from app.routers import operators, machines, tasks, telemetry, safety, idle_events, checkpoints, eta, behavior

app.include_router(operators.router, prefix="/operators", tags=["operators"])
app.include_router(machines.router, prefix="/machines", tags=["machines"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(checkpoints.router, prefix="/tasks", tags=["checkpoints"])
app.include_router(telemetry.router, prefix="/telemetry", tags=["telemetry"])
app.include_router(safety.router, prefix="/safety", tags=["safety"])
app.include_router(idle_events.router, prefix="/idle_events", tags=["idle_events"])
app.include_router(eta.router, prefix="/tasks", tags=["eta"])
app.include_router(behavior.router, prefix="/tasks", tags=["behavior"])
