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
- **CORS en main.py:** controlar orígenes via env var `ALLOWED_ORIGINS` (comma-separated). Default: `http://localhost:3000`.
- **Tests del backend:** usan SQLite en memoria (`sqlite://`) con `StaticPool` — no requieren PostgreSQL local.
- **Migraciones:** usar `sa.UUID` (genérico) en migraciones, no `postgresql.UUID` — garantiza compatibilidad con SQLite en tests.

## Env Vars

### Frontend (.env.local)

```
RESEND_API_KEY=re_xxx          # formulario de contacto (opcional)
API_URL=http://localhost:8000  # URL del backend FastAPI (requerido para newsletter)
```

### Backend (backend/.env)

```
DATABASE_URL=postgresql://user:pass@host/db
ALLOWED_ORIGINS=http://localhost:3000,https://tu-sitio.vercel.app
```

## Deploy

- **Frontend:** Vercel (igual que `main`). Agregar `API_URL=https://tu-api.up.railway.app` en Variables de Entorno de Vercel.
- **Backend:** Railway. Crear proyecto → New Service → GitHub repo → seleccionar rama `stack/nextjs-fastapi-railway`. Railway detecta `backend/railway.toml`. Agregar `DATABASE_URL` (Railway provee PostgreSQL) y `ALLOWED_ORIGINS`. El start command ejecuta `alembic upgrade head` antes de arrancar.

## Branch Strategy

| Rama | Stack añadido |
|------|--------------|
| `main` | Next.js 15 + Tailwind + MDX (solo frontend) |
| `stack/nextjs-fastapi-railway` | + FastAPI + PostgreSQL + Railway ← esta rama |
| `stack/nextjs-supabase` | + Supabase BaaS |
| `stack/astro-vercel` | Astro (reescritura completa) |

Ver `docs/superpowers/plans/2026-06-03-stack-nextjs-fastapi-railway.md` para el plan completo.
