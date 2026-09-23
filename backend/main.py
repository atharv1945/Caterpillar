import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.data_loader import load_all
from app.error_handlers import register_error_handlers

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

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register standardized error handlers
register_error_handlers(app)

@app.get("/health")
def health_check():
    return {"status": "ok"}

from app.routers import operators, machines, tasks, telemetry, safety, idle_events, checkpoints, eta, behavior, translate, voice, scene

app.include_router(operators.router, prefix="/operators", tags=["operators"])
app.include_router(machines.router, prefix="/machines", tags=["machines"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(checkpoints.router, prefix="/tasks", tags=["checkpoints"])
app.include_router(telemetry.router, prefix="/telemetry", tags=["telemetry"])
app.include_router(safety.router, prefix="/safety", tags=["safety"])
app.include_router(idle_events.router, prefix="/idle_events", tags=["idle_events"])
app.include_router(eta.router, prefix="/tasks", tags=["eta"])
app.include_router(behavior.router, prefix="/tasks", tags=["behavior"])
app.include_router(translate.router, prefix="/translate", tags=["translate"])
app.include_router(voice.router, prefix="/voice", tags=["voice"])
app.include_router(scene.router, prefix="/scene", tags=["scene"])
