# Use an official lightweight Python image
FROM python:3.11-slim-bookworm

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies (none are strictly needed for pure SQLite, but good practice)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-privileged user and group for running the app
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -m -s /bin/bash appuser

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-create the directory for SQLite data volume and set correct permissions
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# Copy the rest of the application code and set ownership
COPY --chown=appuser:appgroup app /app/app

# Switch to the non-root user
USER appuser

# Expose FastAPI's standard port
EXPOSE 8000

# Start Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
