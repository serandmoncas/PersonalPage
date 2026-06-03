# stack/nextjs-supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the FastAPI backend with Supabase BaaS for the newsletter feature, teaching the "no custom backend" pattern — same end result, zero infrastructure to manage.

**Architecture:** No `backend/` directory. The Next.js API route (`app/api/newsletter/route.ts`) calls Supabase directly using the service role key (server-side, never exposed to the browser). Supabase handles the `subscribers` table, uniqueness constraints, and persistence. The newsletter form component and footer are unchanged — they already POST to `/api/newsletter`.

**Tech Stack:** Next.js 15, TypeScript, `@supabase/supabase-js` (server-side only), Vercel (deploy), Supabase (free tier: 500MB DB).

---

## File Map

| File | Change | Responsibility |
|------|--------|---------------|
| `lib/supabase/server.ts` | Create | Supabase client factory using service role key |
| `app/api/newsletter/route.ts` | Rewrite | Subscribe via Supabase upsert instead of FastAPI fetch |
| `__tests__/api/newsletter.test.ts` | Create | Unit tests for the new route (mock Supabase client) |
| `backend/` | Delete | Entire directory — no custom backend in this stack |
| `.github/workflows/ci.yml` | Modify | Remove `backend-tests` job and narrow branch triggers |
| `.env.example` | Rewrite | Supabase env vars instead of API_URL |
| `CLAUDE.md` | Rewrite | Document Supabase stack, env vars, deploy, Supabase SQL setup |

**Unchanged:** `components/NewsletterForm.tsx`, `components/layout/Footer.tsx`, `e2e/newsletter.spec.ts`, `__tests__/components/NewsletterForm.test.tsx` — all call `/api/newsletter` which is the stable interface.

---

## Task 1: Create Branch + Remove Backend + Install Supabase

**Files:**
- Delete: `backend/`
- Modify: `.github/workflows/ci.yml`
- Install: `@supabase/supabase-js`

- [ ] **Create branch from main**

```bash
cd /Users/sergiomonsalve/Code/PersonalPage
git checkout main
git pull origin main
git checkout -b stack/nextjs-supabase
```

Expected: on branch `stack/nextjs-supabase`

- [ ] **Remove the entire backend directory**

```bash
rm -rf /Users/sergiomonsalve/Code/PersonalPage/backend
```

- [ ] **Install Supabase client library**

```bash
npm install @supabase/supabase-js
```

Expected: `@supabase/supabase-js` appears in `package.json` dependencies.

- [ ] **Update `.github/workflows/ci.yml`** — remove `backend-tests` job and narrow triggers

Read the current file first. Then:

**Change the `on:` triggers** — remove the fastapi branch, keep only main and this branch:

```yaml
on:
  push:
    branches: [main, stack/nextjs-supabase]
  pull_request:
    branches: [main, stack/nextjs-supabase]
```

**Remove the entire `backend-tests:` job** (the block that starts with `backend-tests:` and ends before the next top-level key or end of file). The file should end after the `e2e:` job.

- [ ] **Verify typecheck passes after removing backend**

```bash
npm run typecheck
```

Expected: clean (no errors — the backend wasn't imported by the frontend).

- [ ] **Commit**

```bash
git add -A
git commit -m "chore: branch stack/nextjs-supabase — remove FastAPI backend, add @supabase/supabase-js"
```

---

## Task 2: Supabase Server Client (TDD)

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `__tests__/lib/supabase/server.test.ts`

- [ ] **Write failing test**

Create `__tests__/lib/supabase/server.test.ts`:

```typescript
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ from: jest.fn() })),
}));

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

describe("createServerClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-test";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("calls createClient with SUPABASE_URL and SERVICE_ROLE_KEY", () => {
    createServerClient();
    expect(createClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "service-role-key-test"
    );
  });

  it("calls createClient exactly once", () => {
    createServerClient();
    expect(createClient).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Run — expect FAIL**

```bash
npm test -- --testPathPattern="__tests__/lib/supabase/server" --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/supabase/server'`

- [ ] **Implement `lib/supabase/server.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Run — expect PASS**

```bash
npm test -- --testPathPattern="__tests__/lib/supabase/server" --no-coverage
```

Expected: PASS — 2 tests.

- [ ] **Commit**

```bash
git add lib/supabase/server.ts __tests__/lib/supabase/server.test.ts
git commit -m "feat: add Supabase server client"
```

---

## Task 3: Newsletter API Route Rewrite (TDD)

**Files:**
- Rewrite: `app/api/newsletter/route.ts`
- Create: `__tests__/api/newsletter.test.ts`

**What changes:** The route no longer proxies to FastAPI. It calls `supabase.from("subscribers").upsert()` directly. Graceful degradation when env vars are missing (same pattern as Resend on `main`).

- [ ] **Write failing tests**

Create `__tests__/api/newsletter.test.ts`:

```typescript
const mockUpsert = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({ upsert: mockUpsert })),
  })),
}));

import { POST } from "@/app/api/newsletter/route";

describe("POST /api/newsletter", () => {
  const SUPABASE_URL = "https://test.supabase.co";
  const SUPABASE_KEY = "service-key";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_KEY;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  function makeRequest(body: unknown) {
    return new Request("http://localhost/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 400 for missing email", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 and calls upsert on valid email", async () => {
    mockUpsert.mockResolvedValue({ error: null });
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(201);
    expect(mockUpsert).toHaveBeenCalledWith(
      { email: "user@example.com", is_active: true },
      { onConflict: "email" }
    );
  });

  it("returns 201 (graceful degradation) when env vars missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(201);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 500 on Supabase error", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "DB error" } });
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(500);
  });

  it("normalizes email to lowercase", async () => {
    mockUpsert.mockResolvedValue({ error: null });
    await POST(makeRequest({ email: "USER@EXAMPLE.COM" }));
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: "user@example.com" }),
      expect.anything()
    );
  });
});
```

- [ ] **Run — expect FAIL**

```bash
npm test -- --testPathPattern="__tests__/api/newsletter" --no-coverage
```

Expected: FAIL — the existing route still calls FastAPI, so tests that check for `upsert` will fail.

- [ ] **Rewrite `app/api/newsletter/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.email || typeof body.email !== "string") {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.warn("[newsletter] Supabase env vars not set — subscription not saved");
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("subscribers")
    .upsert({ email, is_active: true }, { onConflict: "email" });

  if (error) {
    console.error("[newsletter] Supabase error:", error);
    return NextResponse.json({ error: "No se pudo suscribir" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
```

- [ ] **Run — expect PASS**

```bash
npm test -- --testPathPattern="__tests__/api/newsletter" --no-coverage
```

Expected: PASS — 6 tests.

- [ ] **Run all frontend unit tests — verify no regressions**

```bash
npm test -- --ci --no-coverage
```

Expected: all tests pass. Count: 21 (main) + 3 (NewsletterForm) + 2 (supabase server) + 6 (newsletter route) = 32 total.

Note: The `__tests__/components/NewsletterForm.test.tsx` tests (3 tests) are unchanged and still pass — they mock `fetch`, not Supabase.

- [ ] **Commit**

```bash
git add app/api/newsletter/route.ts __tests__/api/newsletter.test.ts
git commit -m "feat: rewrite newsletter route to use Supabase upsert with graceful degradation"
```

---

## Task 4: Update .env.example + CLAUDE.md

**Files:**
- Rewrite: `.env.example`
- Rewrite: `CLAUDE.md`

- [ ] **Rewrite `.env.example`**

```
# .env.example — copy to .env.local and fill in values

# Contact form (optional — site works without it)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Supabase (required for newsletter on this branch)
# Get these from: supabase.com → your project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NOTE: The site works without Supabase — the newsletter form will accept
# submissions but won't save them (graceful degradation).
```

Use `git add -f .env.example` when staging (`.env*` is gitignored).

- [ ] **Rewrite `CLAUDE.md`**

```markdown
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
```

- [ ] **Run typecheck + build**

```bash
npm run typecheck && npm run build
```

Expected: both pass.

- [ ] **Commit**

```bash
git add -f .env.example
git add CLAUDE.md
git commit -m "docs: update .env.example and CLAUDE.md for Supabase stack"
```

---

## Task 5: Final Verification + Push

- [ ] **Run all tests**

```bash
npm test -- --ci --no-coverage
```

Expected: 29 tests passing.

- [ ] **Run build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Run E2E tests**

```bash
npx playwright test --reporter=list
```

Expected: 13 tests passing (newsletter form tests still pass — they test UI, not Supabase).

- [ ] **Check git log on branch**

```bash
git log --oneline stack/nextjs-supabase ^main
```

Expected: 4 commits (chore scaffold, feat server client, feat route rewrite, docs).

- [ ] **Push branch**

```bash
git push -u origin stack/nextjs-supabase
```

---

## Supabase Schema Reference

For deploying: run this SQL once in Supabase SQL Editor before first use.

```sql
-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_subscribers_email ON subscribers (email);

-- Enable RLS — block direct anon access, allow only service role
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- No public policies — service role bypasses RLS by default
```

---

## What This Branch Teaches vs `stack/nextjs-fastapi-railway`

| Dimension | FastAPI + Railway | Supabase |
|-----------|-------------------|----------|
| Backend code written | ~200 lines Python | 0 lines |
| Infrastructure managed | Railway service + PostgreSQL | None |
| Time to first deploy | ~30 min | ~5 min |
| Free tier limits | Railway: 500h/month sleep | Supabase: 500MB, 2 projects |
| Customizable logic | Full control (Python services) | Limited to SQL + Edge Functions |
| Best for | Learning full-stack, custom auth | Shipping fast, prototypes |
