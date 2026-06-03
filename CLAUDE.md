# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`PersonalPage` — template educativo Next.js 15 + Supabase para páginas personales con features dinámicas.
Rama `stack/nextjs-supabase`: reemplaza el backend FastAPI con Supabase BaaS — misma feature, cero infraestructura propia.

**Demo rama main:** https://personal-page-recipe.vercel.app
**Repo:** https://github.com/serandmoncas/PersonalPage

## Commands

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # build de producción
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint .
npm test             # Jest unit tests (32 tests)
npm run test:e2e     # Playwright E2E (requiere npm run build primero)
```

## Architecture

```
lib/supabase/server.ts     ← crea cliente Supabase con SERVICE_ROLE_KEY
app/api/newsletter/route.ts ← POST /api/newsletter → upsert en Supabase
app/api/contact/route.ts    ← Resend (sin cambios vs main)
components/NewsletterForm.tsx ← form (sin cambios vs main)
```

No hay `backend/` — Supabase es el backend.

## Key Conventions

- **`SUPABASE_SERVICE_ROLE_KEY` es server-only** — nunca usar `NEXT_PUBLIC_` para la service role key. Solo en API Routes y Server Components.
- **`NEXT_PUBLIC_SUPABASE_URL`** sí es público (sin secretos, solo identifica el proyecto).
- **Graceful degradation:** si las env vars faltan, el formulario acepta el envío pero no guarda — igual que `RESEND_API_KEY` en `main`.
- **Supabase upsert con `onConflict: "email"`** — idempotente: re-subscribir un email ya existente actualiza `is_active: true` sin duplicar.
- **Email normalizado a lowercase** antes de insertar — evita duplicados por capitalización.

## Env Vars (.env.local)

```
RESEND_API_KEY=re_xxx             # formulario de contacto (opcional)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # solo servidor — no exponer al cliente
```

## Supabase — Setup inicial (manual, una vez)

En el dashboard de Supabase → SQL Editor, ejecutar:

```sql
CREATE TABLE subscribers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: solo service role puede insertar (no acceso anónimo directo)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
```

## Deploy

1. Crear proyecto en [supabase.com](https://supabase.com) (free tier)
2. Ejecutar el SQL de setup arriba en SQL Editor
3. Copiar `SUPABASE_URL` y `SERVICE_ROLE_KEY` desde Settings → API
4. En Vercel: Settings → Environment Variables → agregar las 3 vars
5. `vercel --prod` — sin pasos adicionales de infraestructura

## Branch Strategy

| Rama | Stack añadido |
|------|--------------|
| `main` | Next.js 15 + Tailwind + MDX (solo frontend) |
| `stack/nextjs-fastapi-railway` | + FastAPI + PostgreSQL + Railway |
| `stack/nextjs-supabase` | + Supabase BaaS ← esta rama |
| `stack/astro-vercel` | Astro (reescritura completa) |

Ver `docs/superpowers/plans/2026-06-03-stack-nextjs-supabase.md` para el plan completo.
