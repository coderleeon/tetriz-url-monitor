# Tetriz URL Monitor

A lightweight, production-quality, real-time URL monitoring application. Users can register web URLs, and the system pings them every minute to record their online status (UP/DOWN), response latency, and timestamp. The frontend dashboard polls the API to display active targets in real-time.

---

## 🚀 Technology Stack

- **Backend API**: FastAPI, SQLAlchemy, SQLite, Uvicorn, APScheduler (Background Scheduler).
- **Frontend Dashboard**: Next.js 15, React 19, Tailwind CSS, TypeScript, Lucide Icons.
- **Infrastructure**: Docker, Docker Compose.

---

## 📂 Project Structure

```text
/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI application entrypoint & Lifespan hook
│   │   ├── database.py        # SQLAlchemy SQLite setup (WAL mode enabled)
│   │   ├── models.py          # SQLAlchemy tables (Monitors & Checks)
│   │   ├── schemas.py         # Pydantic schemas (Request/Response validators)
│   │   ├── crud.py            # SQLite queries (uses correlated subqueries)
│   │   └── scheduler.py       # APScheduler setup & ping check task
│   ├── tests/
│   │   └── test_api.py        # API and scheduler unit/mock tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router (Layout & main Dashboard page)
│   │   ├── components/        # Form, table, stats, and badge elements
│   │   ├── hooks/             # useMonitors polling hook
│   │   └── lib/               # Typed fetch wrappers (API client)
│   ├── Dockerfile
│   ├── tailwind.config.ts
│   └── package.json
├── docker-compose.yml
├── README.md
└── AI_LOG.md
```

---

## 🛠️ Quick Start

You can start the entire application (both frontend and backend) with a single command:

```bash
docker compose up --build
```

### Accessing the App:
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **FastAPI Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Testing and Local Development

### 1. Running Backend Unit Tests
We use `pytest` for unit testing the API routes, validators, unique constraints, and the background ping scheduler.

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run test suite
pytest tests/
```

### 2. Running Frontend Locally
To run the frontend Next.js development server:

```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Run dev server
npm run dev
```

---

## ☁️ Cloud Deployment Sketch

To migrate this MVP from Docker Compose to a scalable cloud production setup, we can use the following architecture:

### 1. Hosting Services
- **Backend API & Scheduler**:
  - Deploy the FastAPI Docker container to **AWS ECS (Fargate)** or **GCP Cloud Run**.
  - Since the background scheduler runs inside the API container, horizontal scaling (running multiple API containers) would cause redundant, overlapping URL pings.
  - *Production Solution*: Split the scheduler into a separate worker container (e.g., Celery or ARQ) with Redis/RabbitMQ as a broker, or deploy a single replica of the worker container.
- **Frontend Dashboard**:
  - Deploy to **Vercel** or **AWS Amplify**. Since the frontend is static and communicates directly with the backend REST API, it can be distributed globally via edge networks for low latency.

### 2. Database Migration
- Replace the local SQLite file with a managed relational database like **AWS RDS PostgreSQL** or **GCP Cloud SQL**.
- Swap out the SQLite connection string in the backend (`database.py`) to PostgreSQL. The database tables will automatically initialize on startup thanks to SQLAlchemy.

### 3. CI/CD Pipeline
- Set up a GitHub Actions workflow:
  1. Trigger on merge/push to `main`.
  2. Run `pytest` backend tests and `npm run build` frontend checks.
  3. Build and push Docker images to AWS ECR (Elastic Container Registry) or Google Artifact Registry.
  4. Perform rolling updates on AWS ECS / GCP Cloud Run.
