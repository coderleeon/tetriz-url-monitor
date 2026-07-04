# AI Collaboration Log

This log documents our collaboration, architectural decisions, and key pivots during the development of the Tetriz URL Monitor.

---

## 📅 Session Info
- **Date**: July 4, 2026
- **Objective**: Develop a clean, production-ready URL Monitoring MVP in 6-7 hours.
- **Roles**: 
  - **User**: Product Manager / Lead Architect.
  - **AI (Antigravity)**: Senior/Staff Software Engineer.

---

## 🏛️ Key Architectural & Technical Decisions

### 1. SQLite WAL (Write-Ahead Logging) Mode
- **Decision**: Enabled WAL mode in SQLite connection setup (`database.py`).
- **Rationale**: The background scheduler writes ping check results to SQLite concurrently while users read the dashboard. Default journal modes easily lock SQLite tables. WAL mode allows concurrent readers to access the DB during active write locks.

### 2. In-Process Background Scheduler (APScheduler)
- **Decision**: Wrote an in-process scheduler (`scheduler.py`) executing inside FastAPI's event lifecycle.
- **Rationale**: Avoids the operational overhead of setting up Redis, Celery, or extra broker container configurations. Perfect for a lightweight take-home MVP.

### 3. Avoiding Pydantic `HttpUrl` Pitfalls
- **Decision**: Used `str` for URLs combined with manual scheme assertions (`schemas.py`).
- **Rationale**: Pydantic's `HttpUrl` silently normalizes strings (e.g., appends trailing slashes). This normalization would conflict with URL unique checks (e.g., `https://google.com` vs `https://google.com/` registered as different URLs but referring to the same page).

### 4. Next.js 5s Polling Hook
- **Decision**: Created `useMonitors` custom hook using standard `setInterval` polling.
- **Rationale**: Polling was selected over WebSockets because it is simpler, stateless, and easier to scale. Optimistic UI update logic was incorporated to instantly hide deleted targets and show new targets before the next polling trigger.

---

## 🩹 Pivots & Bug Fixes

### 1. Autoprefixer PostCSS Failure
- **Issue**: During the initial Next.js build verification, the webpack compiler failed with: `Error: Cannot find module 'autoprefixer'`.
- **Fix**: Added `"autoprefixer": "^10.4.20"` to `devDependencies` inside `frontend/package.json`, re-installed node modules, and successfully compiled.

---

## 📈 Git Commit History

1. **Commit 1 (Phase 2 - Backend Core)**:
   - *Message*: `feat(backend): implement core REST API endpoints and database setup`
2. **Commit 2 (Phase 3 - Scheduler)**:
   - *Message*: `feat(scheduler): implement periodic background ping job and integrate app lifecycle`
3. **Commit 3 (Phase 4 - Frontend Dashboard)**:
   - *Message*: `feat(frontend): implement Next.js dashboard with auto-polling hooks and stats overview`
4. **Commit 4 (Phase 5 - Docker)**:
   - *Message*: `feat(docker): add production Dockerfiles and docker-compose orchestration`
