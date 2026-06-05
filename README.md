# AI Personalized Email Outreach Agent

Full-stack platform that uploads recipient data, generates personalized emails with
NVIDIA NIM, lets you review/approve them, and sends them through Gmail SMTP with
sequential delays and rate limiting.

- **Backend**: FastAPI + SQLAlchemy + Celery (Redis broker)
- **Frontend**: Next.js 16 (App Router) + TailwindCSS + TanStack Query
- **AI**: NVIDIA NIM (Llama 3.3 70B by default)
- **Email**: Gmail SMTP with App Password (encrypted at rest via Fernet)

## End-to-end flow

Create campaign → upload contacts (CSV/XLSX/PDF/TXT) → generate emails (AI) →
preview / edit / regenerate / approve → connect Gmail → send → watch live progress & logs.

---

## Run with Docker Compose (recommended)

```bash
cp .env.example .env       # then fill in NVIDIA_NIM_API_KEY and ENCRYPTION_KEY
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API + docs: http://localhost:8000/api  •  http://localhost:8000/docs

Generate an `ENCRYPTION_KEY` first (otherwise stored Gmail passwords won't survive a restart):

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Local development (no Docker)

### Backend

```bash
cd backend
pip install -r requirements.txt
# Defaults to SQLite (local.db) and localhost Redis. Set env vars as needed.
uvicorn app.main:app --reload --port 8000
```

The API auto-creates tables on startup. `GET /api/health` confirms it's up.

**Celery worker** (required for `generate` and `send` to actually run) — needs Redis:

```bash
cd backend
celery -A app.celery_app worker --loglevel=info
```

> Without Redis + the worker, the campaign **create / upload / preview** steps still work
> (they're synchronous HTTP calls), but **generate** and **send** are queued tasks and won't
> process until a worker is running.

### Frontend

```bash
cd frontend
npm install
# Point at the backend; note the /api suffix.
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
npm run dev          # http://localhost:3000
```

---

## Environment variables

See `.env.example`. Key ones: `NVIDIA_NIM_API_KEY` (AI generation),
`ENCRYPTION_KEY` (Gmail password encryption), `DATABASE_URL`, `REDIS_URL`,
`MAX_EMAILS_PER_HOUR` / `MAX_EMAILS_PER_DAY` (rate limits, default 50/400).

## Gmail setup

Use a Google **App Password** (not your account password) — requires 2FA enabled on the
Google account. Add it under **Settings → Gmail Integration**, then use **Test** to verify
SMTP login before sending.

## Notes / current scope

- Single implicit user (backend auto-creates `admin@local`); no auth layer yet.
- Excel/PDF columns are auto-detected; a manual column-mapping UI is future work.
- Open/click tracking is modeled for the future but not implemented.
