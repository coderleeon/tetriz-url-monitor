"""
Background Scheduler for periodically pinging monitored URLs.

Uses APScheduler's BackgroundScheduler to spawn a background thread.
Since jobs run in separate threads, we must open and close SQLAlchemy
sessions explicitly within the job function to avoid connection leaks or
cross-thread session access.
"""

import logging
import os
import time
from datetime import datetime, timezone
import httpx
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Monitor
from app import crud

# Set up logging
logger = logging.getLogger("scheduler")
logging.basicConfig(level=logging.INFO)

# Configuration from environment variables
CHECK_INTERVAL_SECONDS = int(os.getenv("CHECK_INTERVAL_SECONDS", "60"))
PING_TIMEOUT_SECONDS = float(os.getenv("PING_TIMEOUT_SECONDS", "10.0"))

scheduler = BackgroundScheduler()


def ping_monitors():
    """
    Background job that retrieves all active monitors and pings their URLs.
    Stores the results (status code, latency, error) in the checks table.
    """
    logger.info("Starting scheduled URL ping checks...")
    db: Session = SessionLocal()
    try:
        # Retrieve all monitors (only active ones)
        # For simplicity, we filter in Python or write a query.
        # Let's query active monitors.
        monitors = db.query(Monitor).filter(Monitor.is_active == True).all()
        if not monitors:
            logger.info("No active monitors to ping.")
            return

        # Use an HTTP client to ping each URL
        # Using a single client instance for connection pooling across the pings.
        with httpx.Client(timeout=PING_TIMEOUT_SECONDS, follow_redirects=True) as client:
            for monitor in monitors:
                logger.info(f"Pinging {monitor.url} ({monitor.name})...")
                start_time = time.perf_counter()
                
                status_code = None
                response_time = None
                is_up = False
                error_msg = None

                try:
                    # Perform the request
                    response = client.get(monitor.url)
                    end_time = time.perf_counter()
                    
                    status_code = response.status_code
                    response_time = (end_time - start_time) * 1000.0  # Milliseconds
                    
                    # A URL is considered "UP" if it returns a 2xx or 3xx status code
                    if 200 <= response.status_code < 400:
                        is_up = True
                    else:
                        error_msg = f"HTTP Status {response.status_code}"
                except httpx.HTTPError as exc:
                    # Catch transport errors, timeouts, etc.
                    end_time = time.perf_counter()
                    response_time = (end_time - start_time) * 1000.0
                    error_msg = f"{type(exc).__name__}: {str(exc)}"
                except Exception as exc:
                    end_time = time.perf_counter()
                    response_time = (end_time - start_time) * 1000.0
                    error_msg = f"Unexpected Error: {str(exc)}"

                # Create the check record
                crud.create_check(
                    db=db,
                    monitor_id=monitor.id,
                    status_code=status_code,
                    response_time=response_time,
                    is_up=is_up,
                    error=error_msg
                )
                logger.info(f"Finished check for {monitor.url}. Status: {'UP' if is_up else 'DOWN'} (Latency: {response_time:.1f}ms if response_time else N/A)")
                
    except Exception as exc:
        logger.error(f"Error occurred in ping_monitors job: {str(exc)}")
    finally:
        db.close()


def start_scheduler():
    """Starts the background scheduler and registers the periodic ping job."""
    # Ensure job is not duplicated if called multiple times
    if not scheduler.running:
        # Run immediately on startup, then periodically
        scheduler.add_job(
            ping_monitors,
            "interval",
            seconds=CHECK_INTERVAL_SECONDS,
            id="ping_monitors_job",
            replace_existing=True
        )
        scheduler.start()
        logger.info(f"Background scheduler started. Pinging every {CHECK_INTERVAL_SECONDS} seconds.")
        
        # Trigger an initial check in the background immediately so users don't wait 60s
        # for the first status update.
        scheduler.add_job(ping_monitors, id="initial_ping_job")


def shutdown_scheduler():
    """Shuts down the background scheduler cleanly."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background scheduler shut down.")
