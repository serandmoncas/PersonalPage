# stack/nextjs-fastapi-railway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a FastAPI + PostgreSQL backend to the PersonalPage template, teaching the full-stack pattern via a newsletter subscription feature — the simplest dynamic feature that genuinely requires a database.

**Architecture:** Backend is a standalone FastAPI service in `backend/`. Frontend stays in the repo root. The newsletter form (Client Component) posts to a Next.js API route (`/api/newsletter`), which proxies to the FastAPI service — this avoids exposing the backend URL to the browser and keeps CORS simple. The backend owns subscriber persistence and deduplication. Railway hosts the backend + PostgreSQL; Vercel hosts the frontend.

**Tech Stack:** FastAPI 0.115, SQLAlchemy 2 (Column-style), Alembic, Pydantic v2, psycopg2-binary, pytest + httpx TestClient, Python 3.12 (CI/Railway) / 3.9+ (local). Frontend: same Next.js stack as `main`, with one new API route and one new component.

---

## File Map

| File | Responsibility |
|------|---------------|
| `backend/app/main.py` | FastAPI app instance, CORS, router registration, `/health` |
| `backend/app/database.py` | SQLAlchemy engine, SessionLocal, Base, `get_db` dependency |
| `backend/app/models/subscriber.py` | `Subscriber` ORM model (id, email, created_at, is_active) |
| `backend/app/schemas/subscriber.py` | Pydantic schemas: `SubscribeRequest`, `SubscriberResponse` |
| `backend/app/services/newsletter.py` | `subscribe(db, email)` — idempotent subscribe logic |
| `backend/app/routers/newsletter.py` | `POST /api/newsletter/subscribe` endpoint |
| `backend/tests/conftest.py` | pytest fixtures: SQLite DB, TestClient with overridden `get_db` |
| `backend/tests/test_newsletter.py` | Integration tests for subscribe endpoint + health |
| `backend/requirements.txt` | Python dependencies |
| `backend/Dockerfile` | Container for Railway deploy |
| `backend/railway.toml` | Railway build + deploy config |
| `backend/.env.example` | `DATABASE_URL` template |
| `backend/alembic.ini` | Alembic config pointing to `app/database.py` |
| `backend/alembic/env.py` | Alembic migration environment |
| `backend/alembic/versions/001_create_subscribers.py` | First migration |
| `components/NewsletterForm.tsx` | "use client" form — posts to `/api/newsletter` |
| `app/api/newsletter/route.ts` | Next.js proxy route → FastAPI |
| `components/layout/Footer.tsx` | Modified to include `<NewsletterForm />` |
| `.env.example` | Add `API_URL` variable |
| `.github/workflows/ci.yml` | Add `backend-tests` job |
| `e2e/newsletter.spec.ts` | Playwright: newsletter form renders + validates |
| `CLAUDE.md` | Updated with backend commands and new env vars |

---

## Task 1: Create Branch + Backend Scaffold

**Files:**
- Create: `backend/requirements.txt`, `backend/app/main.py`, `backend/app/database.py`
- Create: `backend/.env.example`, `backend/app/__init__.py`, `backend/app/models/__init__.py`
- Create: `backend/app/schemas/__init__.py`, `backend/app/services/__init__.py`, `backend/app/routers/__init__.py`

- [ ] **Create branch from main**

```bash
git checkout main
git pull origin main
git checkout -b stack/nextjs-fastapi-railway
```

Expected: now on branch `stack/nextjs-fastapi-railway`

- [ ] **Create `backend/requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
alembic==1.13.3
pydantic[email]==2.9.2
psycopg2-binary==2.9.9
python-dotenv==1.0.1
httpx==0.27.2
pytest==8.3.3
pytest-cov==5.0.0
```

- [ ] **Create Python virtual environment and install dependencies**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Expected: all packages install without errors.

- [ ] **Create all `__init__.py` files**

```bash
mkdir -p backend/app/models backend/app/schemas backend/app/services backend/app/routers
touch backend/app/__init__.py backend/app/models/__init__.py
touch backend/app/schemas/__init__.py backend/app/services/__init__.py
touch backend/app/routers/__init__.py
```

- [ ] **Create `backend/app/database.py`**

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Create `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import newsletter

app = FastAPI(title="PersonalPage API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # add prod URL via env in railway
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(newsletter.router)


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Create `backend/.env.example`**

```
# backend/.env — copy this to .env and fill in
DATABASE_URL=postgresql://user:password@localhost:5432/personalpage
```

- [ ] **Add backend to root `.gitignore`**

Append to `/Users/sergiomonsalve/Code/PersonalPage/.gitignore`:
```
# Python backend
backend/.venv/
backend/__pycache__/
backend/**/__pycache__/
backend/*.pyc
backend/.env
backend/test.db
```

- [ ] **Commit**

```bash
git add backend/ .gitignore
git commit -m "chore: add FastAPI backend scaffold and database setup"
```

---

## Task 2: Subscriber Model + Alembic Migrations

**Files:**
- Create: `backend/app/models/subscriber.py`
- Create: `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/script.py.mako`
- Create: `backend/alembic/versions/001_create_subscribers.py`

- [ ] **Create `backend/app/models/subscriber.py`**

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
```

- [ ] **Initialize Alembic**

```bash
cd backend
source .venv/bin/activate
alembic init alembic
```

Expected: `alembic.ini` and `alembic/` directory created.

- [ ] **Update `backend/alembic.ini`** — set sqlalchemy url to use env var

Find line: `sqlalchemy.url = driver://user:pass@localhost/dbname`
Replace with: `sqlalchemy.url = %(DATABASE_URL)s`

- [ ] **Update `backend/alembic/env.py`** — import models and use DATABASE_URL env var

Replace the entire file with:

```python
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

load_dotenv()

from app.database import Base  # noqa: E402
import app.models.subscriber  # noqa: F401 — registers model with Base

config = context.config
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Create migration manually** — `backend/alembic/versions/001_create_subscribers.py`

```python
"""create subscribers table

Revision ID: 001
Revises:
Create Date: 2026-06-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "subscribers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_subscribers_email", "subscribers", ["email"])


def downgrade() -> None:
    op.drop_index("ix_subscribers_email")
    op.drop_table("subscribers")
```

- [ ] **Commit**

```bash
git add backend/app/models/ backend/alembic.ini backend/alembic/
git commit -m "feat: add Subscriber model and Alembic migration"
```

---

## Task 3: Newsletter Service (TDD)

**Files:**
- Create: `backend/app/schemas/subscriber.py`
- Create: `backend/app/services/newsletter.py`
- Create: `backend/tests/__init__.py`, `backend/tests/conftest.py`
- Test: `backend/tests/test_newsletter_service.py`

- [ ] **Create `backend/app/schemas/subscriber.py`**

```python
from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid


class SubscribeRequest(BaseModel):
    email: EmailStr


class SubscriberResponse(BaseModel):
    id: uuid.UUID
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Create `backend/tests/conftest.py`**

```python
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

engine = create_engine(
    "sqlite:///./test.db", connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_teardown_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Write failing service tests**

Create `backend/tests/test_newsletter_service.py`:

```python
import pytest
from app.services.newsletter import subscribe
from app.models.subscriber import Subscriber


def test_subscribe_creates_subscriber(db):
    result = subscribe(db, "user@example.com")
    assert result.email == "user@example.com"
    assert result.is_active is True


def test_subscribe_duplicate_is_idempotent(db):
    first = subscribe(db, "user@example.com")
    second = subscribe(db, "user@example.com")
    assert first.id == second.id
    count = db.query(Subscriber).filter_by(email="user@example.com").count()
    assert count == 1


def test_subscribe_reactivates_inactive_subscriber(db):
    sub = subscribe(db, "user@example.com")
    sub.is_active = False
    db.commit()

    result = subscribe(db, "user@example.com")
    assert result.id == sub.id
    assert result.is_active is True
```

- [ ] **Run — expect FAIL**

```bash
cd backend && source .venv/bin/activate
python -m pytest tests/test_newsletter_service.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'app.services.newsletter'`

- [ ] **Implement `backend/app/services/newsletter.py`**

```python
from sqlalchemy.orm import Session
from app.models.subscriber import Subscriber


def subscribe(db: Session, email: str) -> Subscriber:
    existing = db.query(Subscriber).filter(Subscriber.email == email).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            db.refresh(existing)
        return existing
    subscriber = Subscriber(email=email)
    db.add(subscriber)
    db.commit()
    db.refresh(subscriber)
    return subscriber
```

- [ ] **Run — expect PASS**

```bash
python -m pytest tests/test_newsletter_service.py -v
```

Expected: PASS — 3 tests.

- [ ] **Commit**

```bash
git add backend/app/schemas/ backend/app/services/ backend/tests/
git commit -m "feat: add newsletter service with idempotent subscribe logic and tests"
```

---

## Task 4: Newsletter Router (TDD)

**Files:**
- Create: `backend/app/routers/newsletter.py`
- Test: `backend/tests/test_newsletter_router.py`

- [ ] **Write failing router tests**

Create `backend/tests/test_newsletter_router.py`:

```python
def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_subscribe_success(client):
    res = client.post("/api/newsletter/subscribe", json={"email": "user@example.com"})
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "user@example.com"
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data


def test_subscribe_duplicate_returns_201(client):
    client.post("/api/newsletter/subscribe", json={"email": "user@example.com"})
    res = client.post("/api/newsletter/subscribe", json={"email": "user@example.com"})
    assert res.status_code == 201


def test_subscribe_invalid_email_returns_422(client):
    res = client.post("/api/newsletter/subscribe", json={"email": "not-an-email"})
    assert res.status_code == 422


def test_subscribe_missing_email_returns_422(client):
    res = client.post("/api/newsletter/subscribe", json={})
    assert res.status_code == 422
```

- [ ] **Run — expect FAIL**

```bash
python -m pytest tests/test_newsletter_router.py -v
```

Expected: FAIL — router not registered, 404 on `/api/newsletter/subscribe`

- [ ] **Implement `backend/app/routers/newsletter.py`**

```python
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.subscriber import SubscribeRequest, SubscriberResponse
from app.services import newsletter as newsletter_svc

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])


@router.post(
    "/subscribe",
    response_model=SubscriberResponse,
    status_code=status.HTTP_201_CREATED,
)
def subscribe(payload: SubscribeRequest, db: Session = Depends(get_db)):
    return newsletter_svc.subscribe(db, payload.email)
```

- [ ] **Run — expect PASS**

```bash
python -m pytest tests/ -v
```

Expected: PASS — 8 tests (3 service + 5 router).

- [ ] **Run with coverage**

```bash
python -m pytest tests/ --cov=app --cov-report=term-missing
```

Expected: >85% coverage on `app/`.

- [ ] **Commit**

```bash
git add backend/app/routers/ backend/tests/test_newsletter_router.py
git commit -m "feat: add newsletter router with subscribe endpoint and integration tests"
```

---

## Task 5: Frontend — Newsletter API Route + Form (TDD)

**Files:**
- Create: `app/api/newsletter/route.ts`
- Create: `components/NewsletterForm.tsx`
- Test: `__tests__/components/NewsletterForm.test.tsx`

- [ ] **Create `app/api/newsletter/route.ts`**

```typescript
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.email || typeof body.email !== "string") {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email }),
    });
  } catch {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error" }));
    return NextResponse.json({ error: error.detail ?? "Error al suscribir" }, { status: res.status });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
```

- [ ] **Write failing NewsletterForm test**

Create `__tests__/components/NewsletterForm.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterForm } from "@/components/NewsletterForm";

global.fetch = jest.fn();

describe("NewsletterForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders email input and submit button", () => {
    render(<NewsletterForm />);
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /suscribir/i })).toBeInTheDocument();
  });

  it("shows success message after successful submission", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<NewsletterForm />);
    await userEvent.type(screen.getByRole("textbox"), "user@example.com");
    await userEvent.click(screen.getByRole("button", { name: /suscribir/i }));

    expect(await screen.findByText(/suscrito/i)).toBeInTheDocument();
  });

  it("shows error message on API failure", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al suscribir" }),
    });

    render(<NewsletterForm />);
    await userEvent.type(screen.getByRole("textbox"), "user@example.com");
    await userEvent.click(screen.getByRole("button", { name: /suscribir/i }));

    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });
});
```

- [ ] **Run — expect FAIL**

```bash
npm test -- --testPathPattern="NewsletterForm" --no-coverage
```

Expected: FAIL — `Cannot find module '@/components/NewsletterForm'`

- [ ] **Implement `components/NewsletterForm.tsx`**

```typescript
"use client";
import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export function NewsletterForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "Error al suscribir");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Error de conexión");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-[hsl(var(--accent))]">
        ✓ ¡Suscrito! Te avisamos cuando haya novedades.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
          aria-label="Email"
          className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-lg bg-[hsl(var(--accent))] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          {status === "sending" ? "..." : "Suscribir"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs text-red-500">{errorMsg || "Error al suscribir"}</p>
      )}
    </div>
  );
}
```

- [ ] **Run — expect PASS**

```bash
npm test -- --testPathPattern="NewsletterForm" --no-coverage
```

Expected: PASS — 3 tests.

- [ ] **Commit**

```bash
git add app/api/newsletter/ components/NewsletterForm.tsx __tests__/components/NewsletterForm.test.tsx
git commit -m "feat: add newsletter API route and NewsletterForm component with tests"
```

---

## Task 6: Update Footer + .env.example

**Files:**
- Modify: `components/layout/Footer.tsx`
- Modify: `.env.example`

- [ ] **Update `components/layout/Footer.tsx`**

Replace entire file:

```typescript
import { site } from "@/lib/site.config";
import { NewsletterForm } from "@/components/NewsletterForm";

export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] py-10">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium">{site.name}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              <a
                href={`https://github.com/${site.github}`}
                className="hover:text-[hsl(var(--accent))] transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub ↗
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Newsletter
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Novedades sobre el proyecto.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Update `.env.example`**

```
# .env.example — copy to .env.local and fill in values

# Contact form (optional — site works without it)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# FastAPI backend URL (required for newsletter on this branch)
# Local development: http://localhost:8000
# Production: https://your-api.up.railway.app
API_URL=http://localhost:8000
```

- [ ] **Run typecheck + unit tests**

```bash
npm run typecheck && npm test -- --no-coverage
```

Expected: typecheck clean, all 24 tests pass (21 from main + 3 new NewsletterForm tests).

- [ ] **Commit**

```bash
git add components/layout/Footer.tsx .env.example
git commit -m "feat: add NewsletterForm to Footer and document API_URL env var"
```

---

## Task 7: Backend Deploy Config

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/railway.toml`
- Create: `backend/start.sh`

- [ ] **Create `backend/Dockerfile`**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Create `backend/railway.toml`**

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

Note: `alembic upgrade head` runs before starting the server — this applies any pending migrations automatically on each deploy.

- [ ] **Create `backend/start.sh`** (local dev helper)

```bash
#!/bin/bash
set -e
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
chmod +x backend/start.sh
```

- [ ] **Commit**

```bash
git add backend/Dockerfile backend/railway.toml backend/start.sh
git commit -m "feat: add Railway deploy config and Dockerfile for backend"
```

---

## Task 8: CI/CD — Add Backend Tests Job

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Add `backend-tests` job to `.github/workflows/ci.yml`**

Add this job at the end of the `jobs:` section (after `e2e:`):

```yaml
  backend-tests:
    name: Backend tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
          cache-dependency-path: backend/requirements.txt

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests with coverage
        run: python -m pytest tests/ -v --cov=app --cov-report=term-missing
        env:
          DATABASE_URL: sqlite:///./test.db
```

Also update the `on.push.branches` and `on.pull_request.branches` to include `stack/nextjs-fastapi-railway`:

```yaml
on:
  push:
    branches: [main, stack/nextjs-fastapi-railway]
  pull_request:
    branches: [main, stack/nextjs-fastapi-railway]
```

- [ ] **Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add backend-tests job for Python/FastAPI on stack branch"
```

---

## Task 9: E2E Test for Newsletter

**Files:**
- Create: `e2e/newsletter.spec.ts`

- [ ] **Create `e2e/newsletter.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Newsletter", () => {
  test("footer shows newsletter form with email input", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(footer.getByRole("button", { name: /suscribir/i })).toBeVisible();
  });

  test("empty email is blocked by HTML5 required", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await footer.getByRole("button", { name: /suscribir/i }).click();
    // HTML5 required keeps form visible (no success state rendered)
    await expect(footer.getByRole("textbox", { name: /email/i })).toBeVisible();
  });
});
```

Note: these tests do NOT require the backend to be running — they only verify UI presence and HTML5 validation. A test that submits the form and checks the success state would need a mock server or a running backend, which is out of scope for this plan.

- [ ] **Run E2E tests**

```bash
npm run build && npx playwright test e2e/newsletter.spec.ts --reporter=list
```

Expected: 2 tests pass.

- [ ] **Run full E2E suite to verify no regressions**

```bash
npx playwright test --reporter=list
```

Expected: all tests pass (13 total: 11 from main + 2 new).

- [ ] **Commit**

```bash
git add e2e/newsletter.spec.ts
git commit -m "test: add Playwright E2E tests for newsletter form"
```

---

## Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Replace `CLAUDE.md` with updated version for this branch**

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`PersonalPage` — template educativo Next.js 15 + FastAPI para páginas personales con features dinámicas.
Rama `stack/nextjs-fastapi-railway`: añade backend FastAPI + PostgreSQL + newsletter. Ver `main` para el stack solo-frontend.

**Demo rama main:** https://personal-page-recipe.vercel.app
**Repo:** https://github.com/serandmoncas/PersonalPage

## Commands

### Frontend (raíz del repo)

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # build de producción
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint .
npm test             # Jest unit tests (24 tests)
npm run test:e2e     # Playwright E2E (requiere npm run build primero)
```

### Backend (cd backend/)

```bash
source .venv/bin/activate        # activar virtualenv
uvicorn app.main:app --reload    # dev server (localhost:8000)
./start.sh                       # dev server con migraciones automáticas
python -m pytest tests/ -v       # tests unitarios
python -m pytest tests/ --cov=app # con cobertura
alembic upgrade head             # aplicar migraciones
alembic revision --autogenerate -m "desc"  # nueva migración
```

## Architecture

```
# Frontend (raíz)
lib/site.config.ts   ← configuración personal (nombre, bio, links)
lib/mdx.ts           ← lector de archivos MDX con gray-matter
lib/metadata.ts      ← helper SEO
components/NewsletterForm.tsx  ← form que llama /api/newsletter
app/api/newsletter/route.ts   ← proxy Next.js → FastAPI (server-side)
app/api/contact/route.ts      ← Resend (sin cambios vs main)

# Backend (backend/)
app/main.py          ← FastAPI app + CORS + router registration
app/database.py      ← SQLAlchemy 2 + get_db dependency
app/models/          ← modelos ORM (Subscriber)
app/schemas/         ← Pydantic v2 schemas
app/services/        ← lógica de negocio
app/routers/         ← endpoints FastAPI
alembic/             ← migraciones
tests/               ← pytest + httpx TestClient
```

## Key Conventions

- **Server vs Client Components:** igual que en `main` — `"use client"` solo donde hay hooks.
- **Backend en SQLAlchemy 2 Column-style** — usar `Column()`, no `mapped_column()`.
- **API_URL en servidor:** el frontend llama al backend via `app/api/newsletter/route.ts` (server-side). `API_URL` es un env var privado — NO usar `NEXT_PUBLIC_API_URL` para esta llamada.
- **CORS en main.py:** solo `localhost:3000` en dev. Agregar URL de producción de Vercel en Railway via env var.
- **Tests del backend:** usan SQLite con `DATABASE_URL=sqlite:///./test.db` — no requieren PostgreSQL local.
- **Migraciones:** nunca autogenerar tipos ENUM — crear `CREATE TYPE` explícito. Para SQLite en tests, los tipos UUID se mapean a String automáticamente.

## Env Vars

### Frontend (.env.local)

```
RESEND_API_KEY=re_xxx          # formulario de contacto (opcional)
API_URL=http://localhost:8000  # URL del backend FastAPI (requerido para newsletter)
```

### Backend (backend/.env)

```
DATABASE_URL=postgresql://user:pass@host/db
```

## Deploy

- **Frontend:** Vercel (igual que `main`). Agregar `API_URL=https://tu-api.up.railway.app` en Variables de Entorno de Vercel.
- **Backend:** Railway. Crear proyecto → New Service → GitHub repo → seleccionar rama `stack/nextjs-fastapi-railway`. Railway detecta `backend/railway.toml`. Agregar `DATABASE_URL` (Railway provee PostgreSQL). El start command ejecuta `alembic upgrade head` antes de arrancar.

## Branch Strategy

| Rama | Stack añadido |
|------|--------------|
| `main` | Next.js 15 + Tailwind + MDX (solo frontend) |
| `stack/nextjs-fastapi-railway` | + FastAPI + PostgreSQL + Railway ← esta rama |
| `stack/nextjs-supabase` | + Supabase BaaS |
| `stack/astro-vercel` | Astro (reescritura completa) |
```

- [ ] **Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for stack/nextjs-fastapi-railway branch"
```

---

## Task 11: Final Verification

- [ ] **Run all frontend tests**

```bash
npm test -- --ci --no-coverage
```

Expected: 24 tests passing (21 from `main` + 3 NewsletterForm).

- [ ] **Run typecheck**

```bash
npm run typecheck
```

Expected: clean.

- [ ] **Run backend tests**

```bash
cd backend && source .venv/bin/activate && python -m pytest tests/ -v
```

Expected: 8 tests passing.

- [ ] **Run build**

```bash
cd .. && npm run build
```

Expected: build passes, 13 static routes.

- [ ] **Push branch**

```bash
git push -u origin stack/nextjs-fastapi-railway
```

Expected: branch pushed. GitHub Actions will trigger CI on push.

---

## Deploy Guide — Railway (Manual Steps)

These steps are done once in the Railway dashboard, not automatable in CI.

**1. Create Railway project:**
- Go to railway.app → New Project → Deploy from GitHub repo
- Select `serandmoncas/PersonalPage`
- Set root directory to `backend/` OR let Railway use `railway.toml` from the branch

**2. Add PostgreSQL:**
- In Railway project → New Service → Database → PostgreSQL
- Railway injects `DATABASE_URL` into the backend service automatically

**3. Verify deploy:**
```bash
curl https://your-api.up.railway.app/health
# Expected: {"status": "ok"}
```

**4. Add `API_URL` to Vercel:**
- Vercel Dashboard → personal-page-recipe → Settings → Environment Variables
- Add: `API_URL = https://your-api.up.railway.app`

**5. Redeploy frontend:**
```bash
vercel --prod
```

---

## Backlog for this branch

- [ ] Unsubscribe endpoint (`DELETE /api/newsletter/unsubscribe?email=...`)
- [ ] Email confirmation on subscribe (double opt-in via Resend)
- [ ] Admin endpoint to list subscribers (requires auth)
- [ ] CORS: read allowed origins from env var instead of hardcoding `localhost:3000`
- [ ] Contact form routed through FastAPI (replace Resend in Next.js with Resend in Python)
