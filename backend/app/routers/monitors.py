"""
REST API endpoints for monitors.

Endpoints:
  - POST /monitors: Register a new monitor URL
  - GET /monitors: Get all monitors and their latest status
  - DELETE /monitors/{id}: Remove a monitor and all its checks
  - GET /monitors/{id}/checks: Get paginated check history for a monitor
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/monitors", tags=["monitors"])


@router.post(
    "",
    response_model=schemas.MonitorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new monitor",
)
def create_monitor(
    monitor: schemas.MonitorCreate, db: Session = Depends(get_db)
):
    # Check if URL is already registered
    existing = crud.get_monitor_by_url(db, monitor.url)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Monitor with this URL already exists",
        )
    return crud.create_monitor(db, monitor)


@router.get(
    "",
    response_model=list[schemas.MonitorWithLatestCheck],
    summary="List all monitors with their latest check status",
)
def list_monitors(db: Session = Depends(get_db)):
    results = crud.get_monitors_with_latest_checks(db)
    # Map raw models to response schema structure
    response = []
    for monitor, check in results:
        latest_check = None
        if check:
            latest_check = schemas.LatestCheckResponse(
                status_code=check.status_code,
                response_time=check.response_time,
                is_up=check.is_up,
                checked_at=check.checked_at,
            )
        
        response.append(
            schemas.MonitorWithLatestCheck(
                id=monitor.id,
                url=monitor.url,
                name=monitor.name,
                is_active=monitor.is_active,
                created_at=monitor.created_at,
                latest_check=latest_check,
            )
        )
    return response


@router.delete(
    "/{monitor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a monitor",
)
def delete_monitor(monitor_id: int, db: Session = Depends(get_db)):
    success = crud.delete_monitor(db, monitor_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )
    return


@router.get(
    "/{monitor_id}/checks",
    response_model=schemas.CheckListResponse,
    summary="Get check history for a monitor",
)
def get_monitor_checks(
    monitor_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    # Verify monitor exists
    monitor = crud.get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    total, checks = crud.get_monitor_checks(db, monitor_id, limit, offset)
    return schemas.CheckListResponse(total=total, items=checks)
