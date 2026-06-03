# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`PersonalPage` — template educativo Next.js 15 para páginas personales y portafolios.
Rama `main`: stack básico (frontend estático + Vercel free tier, sin base de datos).
Ver `docs/superpowers/specs/2026-06-02-personal-page-recipe-design.md` para el diseño completo.

## Commands

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # build de producción
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint .
npm test             # Jest unit tests
npm run test:watch   # Jest en modo watch
npm run test:coverage # Jest con cobertura
npm run test:e2e     # Playwright E2E (requiere npm run build primero)
```

## Architecture

```
lib/site.config.ts   ← único archivo que el usuario edita primero (nombre, bio, links, skills)
lib/mdx.ts           ← lee archivos .mdx de content/ con gray-matter; __setupWithDirs para tests
lib/metadata.ts      ← helper generatePageMetadata() para SEO consistente en todas las páginas
content/blog/        ← posts del blog como archivos .mdx
content/projects/    ← proyectos del portafolio como archivos .mdx
app/                 ← Next.js App Router pages (Server Components por defecto)
components/layout/   ← Header, Nav, Footer — layout global
components/blog/     ← PostCard, TagBadge, BlogList (client), PostContent (MDX renderer)
components/projects/ ← ProjectCard, TechBadge
components/ui/       ← ThemeToggle
components/ContactForm.tsx ← formulario de contacto (client component)
__tests__/           ← Jest unit tests (espejo de lib/ y components/)
e2e/                 ← Playwright E2E tests
.github/workflows/   ← CI/CD: quality → build + e2e en paralelo
```

## Key Conventions

- **Server vs Client Components:** `app/` pages son Server Components. Componentes con `useState`/`useEffect`/hooks son `"use client"`. `metadata` solo se exporta desde Server Components.
- **`getAllPosts()` y `getAllProjects()`** usan `fs` — solo llamarlas en Server Components o en `lib/mdx.ts` directamente.
- **`site.config.ts`** es la fuente de verdad — todo el sitio lo importa.
- **Sin base de datos en `main`** — el contenido vive en archivos locales `content/`.
- **`RESEND_API_KEY`** es el único env var — el sitio funciona sin él (el form falla silenciosamente).
- **Tests primero para `lib/`** — las funciones de lectura de MDX tienen cobertura completa con `__setupWithDirs`.

## Frontmatter

Blog posts (`content/blog/*.mdx`):
```yaml
title: string
date: YYYY-MM-DD
description: string
tags: string[]
draft?: boolean   # true = excluido del build
```

Projects (`content/projects/*.mdx`):
```yaml
title: string
description: string
tech: string[]
url?: string
github?: string
featured?: boolean  # true = aparece en Home
order?: number      # orden en la lista (menor = primero)
```

## Branch Strategy

| Rama | Stack añadido |
|------|--------------|
| `main` | Next.js 15 + Tailwind + MDX (este branch) |
| `stack/nextjs-fastapi-railway` | + FastAPI + PostgreSQL + Railway |
| `stack/nextjs-supabase` | + Supabase BaaS |
| `stack/astro-vercel` | Astro (reescritura completa) |

Ver `docs/superpowers/plans/2026-06-02-personal-page-main-branch.md` para el plan completo de implementación y guías de cada rama.
