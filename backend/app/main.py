"""
Main FastAPI Application entrypoint.

Sets up CORS, creates tables on startup (simple migration-less strategy for MVPs),
and includes routers. Wires up lifecycle event handlers.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import monitors

from app.scheduler import start_scheduler, shutdown_scheduler

# Ensure the SQLite data directory exists
os.makedirs("./data", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables (if they don't exist)
    Base.metadata.create_all(bind=engine)
    
    # Start the periodic URL ping scheduler
    start_scheduler()
    
    yield
    
    # Shutdown: Cleanup scheduler cleanly
    shutdown_scheduler()

app = FastAPI(
    title="URL Monitor API",
    description="Backend API for monitoring URL status and response times",
    version="1.0.0",
    lifespan=lifespan,
)

# Set up CORS middleware to allow the frontend to communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(monitors.router)

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
