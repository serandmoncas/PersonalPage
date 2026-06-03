# Personal Page Recipe

Template educativo para construir y publicar tu página personal con **Next.js 15**, **TypeScript**, **Tailwind CSS 4** y **blog en MDX**. Deploy gratis en Vercel en menos de 5 minutos.

**Demo:** [personal-page-recipe.vercel.app](https://personal-page-recipe.vercel.app)  
**Curso completo:** [sergiomonsalve.com/cursos](https://sergiomonsalve.com/cursos)

---

## Qué incluye

| Feature | Detalle |
|---------|---------|
| 5 páginas | Home, About, Blog, Projects, Contact |
| Blog con MDX | Posts como archivos `.mdx` — sin CMS, sin BD |
| Dark / Light mode | CSS variables, sin flash al cargar |
| SEO completo | Sitemap, RSS, Open Graph, robots.txt |
| Formulario de contacto | Resend (gratis hasta 3K emails/mes) — opcional |
| Analytics | Vercel Analytics — gratis, sin cookies |
| Testing | 21 tests unitarios (Jest) + 11 E2E (Playwright) |
| CI/CD | GitHub Actions: typecheck → lint → tests → build → E2E |
| Deploy | Vercel free tier — 1 click |

---

## Empezar en 3 pasos

```bash
# 1. Clonar
git clone https://github.com/serandmoncas/PersonalPage
cd PersonalPage && npm install

# 2. Personalizar (editar UN solo archivo)
# Cambia tu nombre, bio y links en lib/site.config.ts

# 3. Correr localmente
npm run dev
```

Abre [localhost:3000](http://localhost:3000) — ya ves tu página con tu nombre.

### Deploy a Vercel

```bash
npm i -g vercel
vercel --prod
```

O conecta el repo en [vercel.com](https://vercel.com) para deploys automáticos en cada push.

---

## Personalización

### 1. Tu información — `lib/site.config.ts`

```typescript
export const site = {
  name: "Tu Nombre",
  bio: "Developer · Builder · Lifelong learner",
  url: "https://tunombre.com",
  github: "tu-usuario",
  twitter: "tu-handle",       // opcional
  linkedin: "tu-perfil",      // opcional
  email: "tu@email.com",
  skills: ["TypeScript", "React", "Next.js"],
};
```

### 2. Escribir un post — `content/blog/mi-post.mdx`

```mdx
---
title: "Mi primer post"
date: "2026-06-01"
description: "De qué va este post."
tags: [nextjs, aprendizaje]
---

## Contenido

Escribe en **Markdown** con soporte para código, imágenes y más.
```

### 3. Agregar un proyecto — `content/projects/mi-proyecto.mdx`

```mdx
---
title: "Mi Proyecto"
description: "Un proyecto que construí."
tech: [nextjs, typescript, tailwind]
github: https://github.com/tu-usuario/mi-proyecto
url: https://mi-proyecto.vercel.app
featured: true
order: 1
---

Descripción larga del proyecto.
```

---

## Comandos

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # build de producción
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm test             # Jest — tests unitarios
npm run test:e2e     # Playwright — E2E (requiere build previo)
```

---

## Variantes de stack

La rama `main` es la más simple. Para features dinámicas, elige una rama:

| Rama | Stack | Deploy | Cuándo usarla |
|------|-------|--------|----------------|
| `main` | Next.js + MDX | Vercel | Portafolio estático, blog |
| `stack/nextjs-fastapi-railway` | + FastAPI + PostgreSQL | Vercel + Railway | Newsletter, auth, CMS propio |
| `stack/nextjs-supabase` | + Supabase BaaS | Vercel + Supabase | Features dinámicas sin backend propio |
| `stack/astro-vercel` | Astro | Vercel | Máximo performance, blog-first |

```bash
# Ejemplo: clonar la variante con Supabase
git clone -b stack/nextjs-supabase https://github.com/serandmoncas/PersonalPage
```

---

## Variables de entorno

Solo una variable es necesaria — y es opcional:

```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx   # Para el formulario de contacto
```

Sin esta variable el sitio funciona igual — el formulario acepta el envío pero no manda el email.

---

## Estructura

```
lib/site.config.ts   ← edita esto primero
content/blog/        ← tus posts (.mdx)
content/projects/    ← tus proyectos (.mdx)
app/                 ← páginas Next.js (App Router)
components/          ← componentes por dominio
__tests__/           ← tests unitarios
e2e/                 ← tests E2E (Playwright)
.github/workflows/   ← CI/CD
```

---

## Aprende a construirlo

Este template es el proyecto del curso **"Personal Page Recipe"** en [sergiomonsalve.com/cursos](https://sergiomonsalve.com/cursos).

El curso cubre: setup de herramientas, IA en tu workflow con Claude Code, personalización, deploy y CI/CD, y cómo elegir la variante de stack correcta para tu proyecto.

---

## Licencia

MIT — úsalo, modifícalo, compártelo.
