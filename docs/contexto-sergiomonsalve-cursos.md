# Contexto: Sección de Cursos — sergiomonsalve.com

Pega este documento completo al inicio de tu sesión con Claude Code en el repo de sergiomonsalve.com.

---

## Qué hay que construir

Agregar una sección `/cursos` a sergiomonsalve.com siguiendo el mismo patrón del repo `serandmoncas/songosorhongo.com`, con estas diferencias clave:

1. **Contenido de lecciones en MDX** (no solo video YouTube) — el contenido principal es texto + código con snippets interactivos, con video opcional
2. **Progreso por lección** — el estudiante puede marcar lecciones como completadas (tabla `lesson_progress` en BD)
3. **Enrollment automático** — el primer curso es gratis y público, sin aprobación manual del admin
4. **Referencia al template** — cada lección puede tener un campo `template_ref` (branch/commit del repo `PersonalPage`) para linkear al código de ejemplo

---

## Patrón de referencia: songosorhongo.com

El repo `serandmoncas/songosorhongo.com` ya tiene una plataforma de cursos funcionando. Úsalo como referencia directa para:

- Estructura de rutas Next.js: `app/cursos/`, `app/cursos/[slug]/`, `app/cursos/[slug]/aprender/`
- Auth de estudiantes: `lib/student-api.ts` + `lib/cursos-api.ts`
- Tipos TypeScript: `lib/cursos-types.ts`
- Componentes: `components/cursos/` (CourseCard, LessonSidebar, VideoPlayer, EnrollmentCTA)
- Backend FastAPI: `backend/app/routers/cursos.py`
- Jerarquía: Course → Module → Lesson

```bash
# Ver el patrón completo
gh api repos/serandmoncas/songosorhongo.com/contents/frontend/app/cursos --jq '.[].name'
gh api repos/serandmoncas/songosorhongo.com/contents/frontend/lib/cursos-types.ts --jq '.content' | base64 -d
gh api repos/serandmoncas/songosorhongo.com/contents/backend/app/routers/cursos.py --jq '.content' | base64 -d
```

---

## Diferencias respecto a songosorhongo.com

### 1. Modelo de datos extendido

**Lo mismo que songosorhongo.com:**
```
Course (id, title, slug, description, thumbnail_url, is_published)
  └── Module (id, course_id, title, description, order, is_published)
        └── Lesson (id, module_id, title, description, order, is_published,
                    youtube_video_id, duration_minutes)
Enrollment (id, student_id, course_id, status, requested_at, approved_at, expires_at)
```

**Agregar en sergiomonsalve.com:**
```sql
-- Lesson: dos campos nuevos
ALTER TABLE lessons ADD COLUMN content_mdx TEXT;          -- contenido MDX de la lección
ALTER TABLE lessons ADD COLUMN template_ref VARCHAR(255); -- ej: "main#section/setup" o commit hash

-- Nueva tabla de progreso
CREATE TABLE lesson_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id)
);
```

### 2. Enrollment automático (sin aprobación manual)

En songosorhongo.com el enrollment requiere aprobación admin. En sergiomonsalve.com el primer curso (PersonalPage Recipe) es gratuito: al solicitar acceso → estado pasa directamente a `approved` con `expires_at = NULL` (sin vencimiento).

```python
# services/enrollment.py — override para cursos gratuitos
def create_enrollment(db, student_id, course_id):
    course = course_svc.get_by_id(db, course_id)
    if course.is_free:
        # Auto-aprobar
        enrollment = Enrollment(
            student_id=student_id,
            course_id=course_id,
            status=EnrollmentStatus.approved,
            approved_at=datetime.utcnow(),
            expires_at=None,
        )
    else:
        # Flujo normal (como songosorhongo)
        enrollment = Enrollment(student_id=student_id, course_id=course_id, status=EnrollmentStatus.pending)
    ...
```

Agregar campo `is_free: bool = False` al modelo `Course`.

### 3. Nuevos endpoints de backend

Además de todos los endpoints de songosorhongo.com, agregar:

```
GET  /api/cursos/{slug}/progreso          → progreso del estudiante (lecciones completadas)
POST /api/cursos/{slug}/lecciones/{id}/completar  → marcar lección como completada
GET  /api/cursos/{slug}/lecciones/{id}/contenido  → devuelve content_mdx (requiere enrollment activo)
```

### 4. Componente de lección distinto

En songosorhongo.com la vista de aprender (`/cursos/[slug]/aprender`) muestra solo `VideoPlayer`.
En sergiomonsalve.com mostrar:

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (módulos + lecciones + checkmarks de progreso)  │
├────────────────────┬────────────────────────────────────┤
│  Contenido MDX     │  Video (YouTube embed, opcional)   │
│  (texto + código)  │                                    │
│                    │                                    │
│  [✓ Marcar como    │                                    │
│   completada]      │                                    │
└────────────────────┴────────────────────────────────────┘
```

Componentes nuevos vs songosorhongo.com:
- `LessonContent.tsx` — renderiza MDX (usar `next-mdx-remote` o `@mdx-js/react`)
- `ProgressIndicator.tsx` — barra de progreso del curso (X/Y lecciones)
- Modificar `LessonSidebar.tsx` — agregar checkmarks de lecciones completadas

---

## Rutas frontend (igual que songosorhongo.com)

```
/cursos                          → listado de cursos
/cursos/registro                 → registro de estudiante
/cursos/login                    → login de estudiante
/cursos/mi-acceso                → enrollments del estudiante
/cursos/[slug]                   → detalle del curso (público)
/cursos/[slug]/aprender          → reproductor de lecciones (requiere auth + enrollment)
```

---

## Auth de estudiantes (idéntico a songosorhongo.com)

Reutilizar exactamente el mismo flujo:
- `localStorage` para el JWT (`student_token`)
- `studentFetch`, `getStudentToken`, `setStudentToken`, `clearStudentToken`
- Login vía `/api/auth/login` (mismo endpoint que admin — el rol viene en el token)
- El rol `student` da acceso a `/cursos/**`

Si sergiomonsalve.com ya tiene backend FastAPI con el mismo modelo de auth (users + roles), solo agregar:
- `UserRole.student` al enum de roles
- El router `/api/cursos` (copiar de songosorhongo.com y extender)
- Migraciones para `lesson_progress` y los campos nuevos en `lessons`

---

## Stack asumido para sergiomonsalve.com

Ajusta si el stack es diferente:
- **Frontend**: Next.js 15+ / TypeScript / Tailwind CSS 4
- **Backend**: FastAPI + SQLAlchemy 2 + PostgreSQL + Alembic
- **Deploy**: Vercel (frontend) + Railway (backend + BD)
- **Auth**: JWT con roles (mismo que songosorhongo.com)

---

## Primer curso a cargar

El primer curso en la plataforma se llama **"Personal Page Recipe"** y sus módulos/lecciones se crean directamente en la BD (via seed script o admin panel). El contenido MDX de cada lección vive en el backend (campo `content_mdx`) o puede servirse desde archivos estáticos si se prefiere.

Módulos del curso:
1. Setup & Herramientas (Claude Code, Git, Node, VS Code)
2. El Template Base (clonar el repo `PersonalPage`, estructura Next.js)
3. IA en tu Workflow (Claude Code en práctica, prompts efectivos)
4. Personalización (diseño, contenido, blog MDX)
5. Deploy & CI/CD (Vercel, GitHub Actions, dominio propio)
6. Variantes de Stack (elegir rama: fastapi, supabase, astro)

---

## Archivos clave del repo de referencia para copiar/adaptar

```
# Frontend (songosorhongo.com → sergiomonsalve.com)
frontend/lib/cursos-api.ts       → copiar, sin cambios
frontend/lib/cursos-types.ts     → copiar, agregar LessonProgress, content_mdx, template_ref
frontend/lib/student-api.ts      → copiar, sin cambios
frontend/components/cursos/      → copiar todo, extender LessonSidebar, agregar LessonContent
frontend/app/cursos/             → copiar estructura completa, adaptar /aprender

# Backend (songosorhongo.com → sergiomonsalve.com)
backend/app/routers/cursos.py    → copiar, agregar /progreso y /completar y /contenido
backend/app/models/lesson.py     → agregar content_mdx, template_ref
backend/app/models/             → agregar lesson_progress.py
backend/app/services/enrollment.py → modificar create_enrollment para cursos is_free
```
