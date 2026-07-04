"""
CRUD helper functions for querying and writing database records.

We use SQLAlchemy v2 select constructs.
To fetch the latest check efficiently for all monitors, we can use a subquery/correlation
or construct it in Python if the dataset is tiny. For clean SQL, we use a lateral or subquery.
For SQLite compatibility, a correlated subquery works best.
"""

from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session
from app import models, schemas


def get_monitor_by_url(db: Session, url: str) -> models.Monitor | None:
    return db.execute(select(models.Monitor).where(models.Monitor.url == url)).scalar_one_or_none()


def get_monitor(db: Session, monitor_id: int) -> models.Monitor | None:
    return db.get(models.Monitor, monitor_id)


def create_monitor(db: Session, monitor: schemas.MonitorCreate) -> models.Monitor:
    db_monitor = models.Monitor(
        url=monitor.url.strip(),
        name=monitor.name.strip()
    )
    db.add(db_monitor)
    db.commit()
    db.refresh(db_monitor)
    return db_monitor


def get_monitors_with_latest_checks(db: Session) -> list[tuple[models.Monitor, models.Check | None]]:
    """
    Returns all monitors paired with their latest check (if any).
    We use a correlated subquery to fetch the latest check's ID for each monitor.
    """
    # Subquery to find the latest check ID for each monitor
    latest_check_sub = (
        select(models.Check.id)
        .where(models.Check.monitor_id == models.Monitor.id)
        .order_by(desc(models.Check.checked_at), desc(models.Check.id))
        .limit(1)
        .correlate(models.Monitor)
        .scalar_subquery()
    )

    # Perform a left outer join from Monitor to Check on the latest check ID
    query = (
        select(models.Monitor, models.Check)
        .outerjoin(models.Check, models.Check.id == latest_check_sub)
        .order_by(models.Monitor.created_at.desc())
    )

    results = db.execute(query).all()
    return [(row[0], row[1]) for row in results]


def delete_monitor(db: Session, monitor_id: int) -> bool:
    monitor = get_monitor(db, monitor_id)
    if not monitor:
        return False
    db.delete(monitor)
    db.commit()
    return True


def get_monitor_checks(db: Session, monitor_id: int, limit: int = 50, offset: int = 0) -> tuple[int, list[models.Check]]:
    total_query = select(func.count(models.Check.id)).where(models.Check.monitor_id == monitor_id)
    total = db.execute(total_query).scalar_one()

    items_query = (
        select(models.Check)
        .where(models.Check.monitor_id == monitor_id)
        .order_by(desc(models.Check.checked_at))
        .offset(offset)
        .limit(limit)
    )
    items = db.execute(items_query).scalars().all()
    return total, list(items)


def create_check(db: Session, monitor_id: int, status_code: int | None, response_time: float | None, is_up: bool, error: str | None = None) -> models.Check:
    db_check = models.Check(
        monitor_id=monitor_id,
        status_code=status_code,
        response_time=response_time,
        is_up=is_up,
        error=error
    )
    db.add(db_check)
    db.commit()
    db.refresh(db_check)
    return db_check
