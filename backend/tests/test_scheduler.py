import pytest
from unittest.mock import MagicMock, patch
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app import models
from app.scheduler import ping_monitors, SessionLocal

# Setup an in-memory database for scheduler testing and patch SessionLocal
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    with patch("app.scheduler.SessionLocal", TestingSessionLocal):
        yield
    Base.metadata.drop_all(bind=engine)


def test_ping_monitors_success():
    # Insert an active monitor
    db = TestingSessionLocal()
    monitor = models.Monitor(url="https://test-success.com", name="Test Success")
    db.add(monitor)
    db.commit()
    db.close()

    # Mock httpx.Client response
    mock_response = MagicMock()
    mock_response.status_code = 200

    with patch("httpx.Client.get", return_value=mock_response):
        ping_monitors()

    # Check that a check was recorded
    db = TestingSessionLocal()
    checks = db.query(models.Check).all()
    assert len(checks) == 1
    assert checks[0].status_code == 200
    assert checks[0].is_up is True
    assert checks[0].response_time is not None
    assert checks[0].error is None
    db.close()


def test_ping_monitors_http_error_down():
    # Insert an active monitor
    db = TestingSessionLocal()
    monitor = models.Monitor(url="https://test-error.com", name="Test HTTP Error")
    db.add(monitor)
    db.commit()
    db.close()

    # Mock httpx.Client response returning a 500 status code
    mock_response = MagicMock()
    mock_response.status_code = 500

    with patch("httpx.Client.get", return_value=mock_response):
        ping_monitors()

    # Check that a check was recorded as down
    db = TestingSessionLocal()
    checks = db.query(models.Check).all()
    assert len(checks) == 1
    assert checks[0].status_code == 500
    assert checks[0].is_up is False
    assert checks[0].error == "HTTP Status 500"
    db.close()


def test_ping_monitors_timeout_exception():
    # Insert an active monitor
    db = TestingSessionLocal()
    monitor = models.Monitor(url="https://test-timeout.com", name="Test Timeout")
    db.add(monitor)
    db.commit()
    db.close()

    # Mock httpx.Client response raising a timeout exception
    with patch("httpx.Client.get", side_effect=httpx.ConnectTimeout("Connection timed out")):
        ping_monitors()

    # Check that check recorded failure without status code
    db = TestingSessionLocal()
    checks = db.query(models.Check).all()
    assert len(checks) == 1
    assert checks[0].status_code is None
    assert checks[0].is_up is False
    assert "ConnectTimeout" in checks[0].error
    db.close()
