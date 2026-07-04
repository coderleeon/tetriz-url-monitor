"""
Database engine and session configuration.

Uses SQLite with check_same_thread=False since FastAPI serves requests
across multiple threads. WAL journal mode improves concurrent read
performance — critical when the scheduler writes checks while the API
serves reads.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = "sqlite:///./data/monitor.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


# Enable WAL mode for better concurrent read/write performance.
# This is a connection-level pragma, so we set it on each new connection.
@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()


class Base(DeclarativeBase):
    pass


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
