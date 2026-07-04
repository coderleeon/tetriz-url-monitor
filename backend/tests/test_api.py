import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# Set up an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Override the dependency with the test database
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    # Create the tables before each test
    Base.metadata.create_all(bind=engine)
    yield
    # Drop the tables after each test
    Base.metadata.drop_all(bind=engine)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_monitor():
    # Test valid creation
    payload = {"url": "https://google.com", "name": "Google Search"}
    response = client.post("/monitors", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["url"] == "https://google.com"
    assert data["name"] == "Google Search"
    assert "id" in data
    assert data["is_active"] is True

    # Test duplicate URL conflict
    response = client.post("/monitors", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_create_monitor_invalid_url():
    # Missing protocol
    payload = {"url": "google.com", "name": "Google"}
    response = client.post("/monitors", json=payload)
    assert response.status_code == 422

    # Empty name
    payload = {"url": "https://google.com", "name": "   "}
    response = client.post("/monitors", json=payload)
    assert response.status_code == 422


def test_list_monitors_empty():
    response = client.get("/monitors")
    assert response.status_code == 200
    assert response.json() == []


def test_list_monitors_with_data():
    # Create a monitor
    payload = {"url": "https://github.com", "name": "GitHub"}
    client.post("/monitors", json=payload)

    response = client.get("/monitors")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["url"] == "https://github.com"
    assert data[0]["latest_check"] is None


def test_delete_monitor():
    # Create monitor
    payload = {"url": "https://github.com", "name": "GitHub"}
    create_res = client.post("/monitors", json=payload)
    monitor_id = create_res.json()["id"]

    # Delete monitor
    delete_res = client.delete(f"/monitors/{monitor_id}")
    assert delete_res.status_code == 204

    # Get monitors (should be empty)
    list_res = client.get("/monitors")
    assert len(list_res.json()) == 0

    # Delete non-existent
    delete_res2 = client.delete(f"/monitors/{monitor_id}")
    assert delete_res2.status_code == 404


def test_monitor_checks_not_found():
    response = client.get("/monitors/9999/checks")
    assert response.status_code == 404
