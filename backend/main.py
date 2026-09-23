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

# TODO: Add routers for other endpoints (Phase 2)
# from app.api import tasks, safety, ...
# app.include_router(tasks.router, prefix="/api/tasks")
