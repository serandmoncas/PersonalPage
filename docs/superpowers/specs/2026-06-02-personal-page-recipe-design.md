# Design: Personal Page Recipe

**Fecha:** 2026-06-02
**Repo:** `serandmoncas/PersonalPage`
**Estado:** Aprobado

---

## Resumen

Sistema de dos capas para enseñar a cualquier persona a construir y publicar su página personal:

1. **Este repo (`PersonalPage`)** — template de código que el estudiante clona. Rama `main` con Next.js 15 + TypeScript + Tailwind + blog MDX + deploy Vercel free. Ramas adicionales para variantes de stack más complejas.
2. **`sergiomonsalve.com/cursos`** — plataforma donde vive el curso que enseña a usar este template. Las lecciones referencian commits/secciones de este repo. Contexto de implementación: `docs/contexto-sergiomonsalve-cursos.md`.

---

## Capa 1 — El Template (este repo)

### Estrategia de ramas

| Rama | Stack | Deploy | Complejidad |
|------|-------|--------|-------------|
| `main` | Next.js 15 + TypeScript + Tailwind | Vercel (free) | Principiante |
| `stack/nextjs-fastapi-railway` | + FastAPI + PostgreSQL | Vercel + Railway | Intermedio |
| `stack/nextjs-supabase` | + Supabase BaaS | Vercel + Supabase | Intermedio |
| `stack/astro-vercel` | Astro + Islands | Vercel (free) | Principiante alt. |

La rama `main` es el punto de entrada para el curso. Las ramas de stack se construyen después, una vez que `main` esté estable. Cada rama es un proyecto completo e independientemente deployable.

### Estructura de archivos — rama `main`

```
PersonalPage/
├── app/
│   ├── layout.tsx                  ← fuentes, metadata global, ThemeProvider
│   ├── page.tsx                    ← Home: hero + bio + últimos posts + proyectos destacados
│   ├── about/page.tsx              ← bio larga, skills, experiencia, links sociales
│   ├── blog/
│   │   ├── page.tsx                ← lista de posts con tags y búsqueda estática
│   │   └── [slug]/page.tsx         ← post individual renderizado desde MDX
│   ├── projects/page.tsx           ← grid de proyectos con tech stack badges
│   └── api/contact/route.ts        ← formulario de contacto vía Resend (free tier)
├── components/
│   ├── layout/                     ← Header, Footer, Nav, MobileMenu
│   ├── blog/                       ← PostCard, PostContent, TagBadge, TableOfContents
│   ├── projects/                   ← ProjectCard, TechBadge
│   └── ui/                         ← Button, ThemeToggle, Badge
├── content/
│   ├── blog/                       ← archivos .mdx (posts del blog)
│   └── projects/                   ← archivos .mdx (proyectos del portfolio)
├── lib/
│   ├── mdx.ts                      ← leer, parsear y ordenar archivos MDX con gray-matter
│   ├── metadata.ts                  ← helper generateMetadata() con OG tags
│   └── site.config.ts              ← único archivo de configuración personal
├── public/
│   └── avatar.jpg                  ← placeholder, el estudiante reemplaza
├── .github/
│   └── workflows/
│       └── ci.yml                  ← lint + typecheck + build en cada PR
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                     ← headers de seguridad pre-configurados
├── .env.example                    ← RESEND_API_KEY (único env var opcional)
└── CLAUDE.md                       ← guía para Claude Code al trabajar en este repo
```

### El único archivo que el estudiante edita primero

```typescript
// lib/site.config.ts
export const site = {
  name: "Tu Nombre",
  bio: "Developer · Builder · Lifelong learner",
  url: "https://tunombre.com",
  github: "tu-usuario",
  twitter: "tu-handle",        // opcional
  linkedin: "tu-perfil",       // opcional
  email: "tu@email.com",
};
```

Todo el sitio (metadata, footer, hero, OG tags) se alimenta de este objeto. El estudiante ve su nombre en el sitio antes de tocar un componente.

### Páginas y características

**Home (`/`):** Hero con nombre y bio desde `site.config.ts`, últimos 3 posts del blog, proyectos destacados. Sin estado — 100% SSG.

**About (`/about`):** Contenido editable directo en el archivo de página o como MDX. Skills como array en `site.config.ts`. Sin DB.

**Blog (`/blog` y `/blog/[slug]`):** Posts como archivos `.mdx` en `content/blog/`. Frontmatter: `title`, `date`, `description`, `tags[]`, `draft?`. Feed RSS en `/rss.xml`. Búsqueda client-side estática con la lista de posts pre-generada en build time.

**Projects (`/projects`):** Proyectos como archivos `.mdx` en `content/projects/`. Frontmatter: `title`, `description`, `tech[]`, `url?`, `github?`, `featured?`.

**Contact (`/contact`):** Formulario con validación client-side. API Route (`/api/contact`) envía email vía Resend. Sin esta variable de entorno el formulario falla silenciosamente con mensaje amigable — el estudiante puede omitirla.

### Herramientas pre-configuradas

| Herramienta | Propósito | Costo |
|-------------|-----------|-------|
| Next.js 15 | Framework principal + SSG | Free |
| TypeScript | Tipado estático | Free |
| Tailwind CSS 4 | Estilos | Free |
| `@next/mdx` + `gray-matter` | Blog y proyectos como archivos MDX | Free |
| Dark/Light mode | CSS variables, sin flash al cargar | Free |
| Vercel Analytics | Métricas de visitas sin cookies | Free (1 sitio) |
| ESLint + Prettier | Calidad de código | Free |
| GitHub Actions CI | lint + typecheck + build en PRs | Free |
| Resend | Formulario de contacto | Free (3K emails/mes) |

### SEO

- `metadata` export en cada página con title, description, OG image
- `sitemap.xml` generado automáticamente por Next.js (`app/sitemap.ts`)
- `robots.txt` estático en `public/`
- OG image por defecto — placeholder reemplazable en `public/og.png`

### CI/CD — GitHub Actions

```yaml
# .github/workflows/ci.yml
# Corre en cada PR hacia main:
# 1. npm ci
# 2. npm run lint
# 3. npm run build
# Vercel hace deploy automático al mergear a main (integración nativa).
```

### Comandos del proyecto

```bash
npm run dev      # servidor de desarrollo (localhost:3000)
npm run build    # build de producción
npm run lint     # ESLint
npm run typecheck  # tsc --noEmit
```

### Deploy — 3 pasos

```bash
git clone https://github.com/serandmoncas/PersonalPage
cd PersonalPage && npm install
npx vercel --prod
```

Vercel detecta Next.js automáticamente. Sin variables de entorno obligatorias para el primer deploy.

---

## Capa 2 — El Curso (sergiomonsalve.com)

Implementación separada en el repo de sergiomonsalve.com. Ver `docs/contexto-sergiomonsalve-cursos.md` para el contexto completo del agente.

### Módulos del curso "Personal Page Recipe"

| # | Módulo | Referencia en el template |
|---|--------|--------------------------|
| 1 | Setup & Herramientas | README, CLAUDE.md |
| 2 | El Template Base | `app/`, `lib/site.config.ts` |
| 3 | IA en tu Workflow | Commits de práctica, CLAUDE.md |
| 4 | Personalización | `content/`, componentes |
| 5 | Deploy & CI/CD | `.github/workflows/`, `vercel.json` |
| 6 | Variantes de Stack | Ramas `stack/*` |

Las lecciones MDX viven en la BD de sergiomonsalve.com (`content_mdx`). Cada lección puede referenciar secciones de este repo mediante links directos a GitHub (archivo, línea, commit o rama).

---

## Separación de responsabilidades

| Repo | Responsabilidad |
|------|----------------|
| `PersonalPage` (este repo) | Template de código que el estudiante clona y personaliza |
| `sergiomonsalve.com` | Plataforma del curso: auth, lecciones, progreso, enrollment |
| `songosorhongo.com` | Referencia de arquitectura para la plataforma de cursos |

---

## Orden de construcción

1. **`main` branch del template** — estructura, páginas, MDX, CI/CD ← **empezamos aquí**
2. **Contenido de ejemplo** — 1 post de blog, 2 proyectos de muestra con datos reales
3. **Plataforma de cursos en sergiomonsalve.com** — usando `docs/contexto-sergiomonsalve-cursos.md`
4. **Ramas de stack adicionales** — `stack/nextjs-fastapi-railway` primero (más cercano al patrón conocido)
5. **Lecciones del curso** — MDX escrito en sergiomonsalve.com referenciando commits de este repo

---

## Fuera de scope (por ahora)

- Sistema de comentarios en el blog
- Búsqueda full-text (Algolia, etc.)
- CMS headless (Contentlayer, Sanity, etc.)
- Autenticación en el template `main`
- Internacionalización (i18n)
