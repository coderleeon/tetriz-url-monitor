"""
Pydantic schemas for request validation and response serialization.

Naming convention:
  - *Create  → request body for POST
  - *Response → serialized output
  - *WithLatestCheck → enriched output (monitor + latest check)

We use `str` for the URL field instead of Pydantic's HttpUrl to avoid
silent normalization (e.g., adding trailing slashes) that would break
uniqueness checks. We validate the scheme manually.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


# ---------------------------------------------------------------------------
# Monitor schemas
# ---------------------------------------------------------------------------

class MonitorCreate(BaseModel):
    """Request body for registering a new monitor."""

    url: str
    name: str

    @field_validator("url")
    @classmethod
    def validate_url_scheme(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class MonitorResponse(BaseModel):
    """Serialized monitor (without check data)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    name: str
    is_active: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Check schemas
# ---------------------------------------------------------------------------

class CheckResponse(BaseModel):
    """Serialized check result."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status_code: int | None
    response_time: float | None
    is_up: bool
    error: str | None
    checked_at: datetime


class CheckListResponse(BaseModel):
    """Paginated list of checks for a single monitor."""

    total: int
    items: list[CheckResponse]


# ---------------------------------------------------------------------------
# Enriched monitor (with latest check)
# ---------------------------------------------------------------------------

class LatestCheckResponse(BaseModel):
    """Subset of CheckResponse used in the dashboard list view."""

    model_config = ConfigDict(from_attributes=True)

    status_code: int | None
    response_time: float | None
    is_up: bool
    checked_at: datetime


class MonitorWithLatestCheck(BaseModel):
    """Monitor + its most recent check (None if never checked)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    name: str
    is_active: bool
    created_at: datetime
    latest_check: LatestCheckResponse | None
