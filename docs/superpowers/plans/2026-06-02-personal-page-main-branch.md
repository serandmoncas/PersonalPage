# Personal Page Recipe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `main` branch of the PersonalPage template — a fully deployable Next.js 15 personal site (blog, portfolio, contact) that any student can clone, personalize in one file, and deploy free on Vercel.

**Architecture:** Static-first (SSG/SSR with App Router). Content lives as local `.mdx` files in `content/`. `lib/site.config.ts` is the single personalization entry point — the entire site reads from it. No database, no mandatory env vars for a first deploy.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, next-mdx-remote (App Router RSC), gray-matter, next-themes, Resend, @vercel/analytics, Jest 29 + Testing Library, Playwright, GitHub Actions.

---

## File Map

| File | Responsibility |
|------|---------------|
| `lib/site.config.ts` | Single source of truth for name, bio, links, skills |
| `lib/mdx.ts` | Read and parse `.mdx` files from `content/` |
| `lib/metadata.ts` | `generatePageMetadata()` helper — SEO for all pages |
| `app/layout.tsx` | Root layout: ThemeProvider, Analytics, font variables |
| `app/globals.css` | Tailwind import + CSS custom properties (light/dark tokens) |
| `app/page.tsx` | Home: hero + recent posts + featured projects |
| `app/about/page.tsx` | About: bio, skills, links |
| `app/blog/page.tsx` | Blog list with tag filter (static) |
| `app/blog/[slug]/page.tsx` | Blog post rendered from MDX |
| `app/projects/page.tsx` | Projects grid |
| `app/api/contact/route.ts` | Contact form handler via Resend |
| `app/contact/page.tsx` | Contact page with form |
| `app/sitemap.ts` | Auto-generated sitemap.xml |
| `app/rss.xml/route.ts` | RSS feed |
| `components/layout/Header.tsx` | Site header with nav + theme toggle |
| `components/layout/Footer.tsx` | Footer with links |
| `components/layout/Nav.tsx` | Navigation links |
| `components/ui/ThemeToggle.tsx` | Dark/light switch |
| `components/blog/PostCard.tsx` | Blog post preview card |
| `components/blog/TagBadge.tsx` | Clickable tag chip |
| `components/blog/PostContent.tsx` | MDX renderer wrapper |
| `components/projects/ProjectCard.tsx` | Project card with links + tech |
| `components/projects/TechBadge.tsx` | Tech stack badge |
| `content/blog/hello-world.mdx` | Sample blog post |
| `content/projects/personal-page.mdx` | Sample project 1 |
| `content/projects/songosorhongo.mdx` | Sample project 2 (real example) |
| `.github/workflows/ci.yml` | CI: typecheck + lint + test + build + e2e |
| `vercel.json` | Security headers |
| `.env.example` | RESEND_API_KEY documentation |
| `__tests__/lib/mdx.test.ts` | Unit tests for MDX reader |
| `__tests__/lib/metadata.test.ts` | Unit tests for metadata helper |
| `__tests__/components/*.test.tsx` | Component unit tests |
| `e2e/navigation.spec.ts` | E2E: all pages load, nav works |
| `e2e/blog.spec.ts` | E2E: blog list, post page, tag filter |
| `e2e/contact.spec.ts` | E2E: contact form validation |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `app/globals.css`

- [ ] **Scaffold Next.js project**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-git
```

Expected: project files created in current directory.

- [ ] **Install dependencies**

```bash
npm install next-mdx-remote gray-matter next-themes resend @vercel/analytics remark-gfm rehype-pretty-code shiki feed
npm install -D @tailwindcss/typography prettier prettier-plugin-tailwindcss jest jest-environment-jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @playwright/test @types/jest @types/node
```

- [ ] **Configure `next.config.ts`**

```typescript
import type { NextConfig } from "next";

const config: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  experimental: { mdxRs: false },
};

export default config;
```

- [ ] **Configure `tsconfig.json` paths**

Ensure `compilerOptions.paths` includes:
```json
{
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

- [ ] **Configure Jest (`jest.config.ts`)**

```typescript
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterFramework: ["<rootDir>/jest.setup.ts"],
  testPathPattern: ["__tests__/**/*.test.(ts|tsx)"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  collectCoverageFrom: ["lib/**/*.ts", "components/**/*.tsx", "app/**/*.ts", "app/**/*.tsx"],
};

export default createJestConfig(config);
```

- [ ] **Configure jest setup (`jest.setup.ts`)**

```typescript
import "@testing-library/jest-dom";
```

- [ ] **Configure Playwright (`playwright.config.ts`)**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Add scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Configure Prettier (`.prettierrc`)**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project with tooling"
```

---

## Task 2: `site.config.ts` — Personalization Entry Point

**Files:**
- Create: `lib/site.config.ts`

- [ ] **Write `lib/site.config.ts`**

```typescript
export const site = {
  name: "Tu Nombre",
  bio: "Developer · Builder · Lifelong learner",
  url: "https://tunombre.com",
  github: "tu-usuario",
  twitter: "tu-handle",
  linkedin: "tu-perfil",
  email: "tu@email.com",
  skills: ["TypeScript", "React", "Next.js", "Python", "PostgreSQL"],
} as const;

export type SiteConfig = typeof site;
```

- [ ] **Commit**

```bash
git add lib/site.config.ts
git commit -m "feat: add site.config.ts — single personalization entry point"
```

---

## Task 3: `lib/mdx.ts` — Content Reader (TDD)

**Files:**
- Create: `lib/mdx.ts`
- Test: `__tests__/lib/mdx.test.ts`

- [ ] **Write the failing tests first**

```typescript
// __tests__/lib/mdx.test.ts
import fs from "fs";
import path from "path";
import { getAllPosts, getPostBySlug, getAllProjects, getProjectBySlug } from "@/lib/mdx";

const FIXTURES_DIR = path.join(__dirname, "fixtures");

// Setup: create temp fixture files before tests
beforeAll(() => {
  fs.mkdirSync(path.join(FIXTURES_DIR, "blog"), { recursive: true });
  fs.mkdirSync(path.join(FIXTURES_DIR, "projects"), { recursive: true });

  fs.writeFileSync(
    path.join(FIXTURES_DIR, "blog", "hello-world.mdx"),
    `---\ntitle: Hello World\ndate: 2026-01-15\ndescription: My first post\ntags: [nextjs, typescript]\n---\n\n# Hello\n\nContent here.`
  );
  fs.writeFileSync(
    path.join(FIXTURES_DIR, "blog", "draft-post.mdx"),
    `---\ntitle: Draft\ndate: 2026-01-20\ndescription: Not published\ntags: []\ndraft: true\n---\n\nDraft content.`
  );
  fs.writeFileSync(
    path.join(FIXTURES_DIR, "projects", "my-project.mdx"),
    `---\ntitle: My Project\ndescription: A cool project\ntech: [nextjs, tailwind]\ngithub: https://github.com/user/project\nfeatured: true\norder: 1\n---\n\nProject details.`
  );
});

afterAll(() => {
  fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
});

// Mock the content directories to point to fixtures
jest.mock("@/lib/mdx", () => {
  const BLOG_DIR = path.join(__dirname, "fixtures/blog");
  const PROJECTS_DIR = path.join(__dirname, "fixtures/projects");
  return jest.requireActual("@/lib/mdx").__setupWithDirs(BLOG_DIR, PROJECTS_DIR);
});

describe("getAllPosts", () => {
  it("returns published posts sorted by date descending", () => {
    const posts = getAllPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe("hello-world");
    expect(posts[0].title).toBe("Hello World");
    expect(posts[0].tags).toEqual(["nextjs", "typescript"]);
  });

  it("excludes draft posts", () => {
    const posts = getAllPosts();
    expect(posts.find((p) => p.slug === "draft-post")).toBeUndefined();
  });
});

describe("getPostBySlug", () => {
  it("returns post with content for a valid slug", () => {
    const post = getPostBySlug("hello-world");
    expect(post).not.toBeNull();
    expect(post!.title).toBe("Hello World");
    expect(post!.content).toContain("Content here");
  });

  it("returns null for unknown slug", () => {
    expect(getPostBySlug("does-not-exist")).toBeNull();
  });
});

describe("getAllProjects", () => {
  it("returns projects sorted by order", () => {
    const projects = getAllProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].title).toBe("My Project");
    expect(projects[0].featured).toBe(true);
  });
});

describe("getProjectBySlug", () => {
  it("returns project with content for a valid slug", () => {
    const project = getProjectBySlug("my-project");
    expect(project).not.toBeNull();
    expect(project!.tech).toEqual(["nextjs", "tailwind"]);
    expect(project!.content).toContain("Project details");
  });

  it("returns null for unknown slug", () => {
    expect(getProjectBySlug("does-not-exist")).toBeNull();
  });
});
```

- [ ] **Run tests — expect failure**

```bash
npm test -- --testPathPattern="__tests__/lib/mdx"
```

Expected: FAIL — `Cannot find module '@/lib/mdx'`

- [ ] **Implement `lib/mdx.ts`**

```typescript
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface PostMeta {
  title: string;
  date: string;
  description: string;
  tags: string[];
  draft: boolean;
  slug: string;
}

export interface Post extends PostMeta {
  content: string;
}

export interface ProjectMeta {
  title: string;
  description: string;
  tech: string[];
  url?: string;
  github?: string;
  featured: boolean;
  order: number;
  slug: string;
}

export interface Project extends ProjectMeta {
  content: string;
}

function makeReaders(blogDir: string, projectsDir: string) {
  function getAllPosts(): PostMeta[] {
    if (!fs.existsSync(blogDir)) return [];
    return fs
      .readdirSync(blogDir)
      .filter((f) => f.endsWith(".mdx"))
      .map((filename) => {
        const slug = filename.replace(/\.mdx$/, "");
        const raw = fs.readFileSync(path.join(blogDir, filename), "utf-8");
        const { data } = matter(raw);
        return {
          title: data.title ?? slug,
          date: data.date ? String(data.date) : "",
          description: data.description ?? "",
          tags: data.tags ?? [],
          draft: data.draft ?? false,
          slug,
        };
      })
      .filter((p) => !p.draft)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  function getPostBySlug(slug: string): Post | null {
    const filepath = path.join(blogDir, `${slug}.mdx`);
    if (!fs.existsSync(filepath)) return null;
    const raw = fs.readFileSync(filepath, "utf-8");
    const { data, content } = matter(raw);
    return {
      title: data.title ?? slug,
      date: data.date ? String(data.date) : "",
      description: data.description ?? "",
      tags: data.tags ?? [],
      draft: data.draft ?? false,
      slug,
      content,
    };
  }

  function getAllProjects(): ProjectMeta[] {
    if (!fs.existsSync(projectsDir)) return [];
    return fs
      .readdirSync(projectsDir)
      .filter((f) => f.endsWith(".mdx"))
      .map((filename) => {
        const slug = filename.replace(/\.mdx$/, "");
        const raw = fs.readFileSync(path.join(projectsDir, filename), "utf-8");
        const { data } = matter(raw);
        return {
          title: data.title ?? slug,
          description: data.description ?? "",
          tech: data.tech ?? [],
          url: data.url,
          github: data.github,
          featured: data.featured ?? false,
          order: data.order ?? 99,
          slug,
        };
      })
      .sort((a, b) => a.order - b.order);
  }

  function getProjectBySlug(slug: string): Project | null {
    const filepath = path.join(projectsDir, `${slug}.mdx`);
    if (!fs.existsSync(filepath)) return null;
    const raw = fs.readFileSync(filepath, "utf-8");
    const { data, content } = matter(raw);
    return {
      title: data.title ?? slug,
      description: data.description ?? "",
      tech: data.tech ?? [],
      url: data.url,
      github: data.github,
      featured: data.featured ?? false,
      order: data.order ?? 99,
      slug,
      content,
    };
  }

  return { getAllPosts, getPostBySlug, getAllProjects, getProjectBySlug };
}

const DEFAULT_BLOG_DIR = path.join(process.cwd(), "content/blog");
const DEFAULT_PROJECTS_DIR = path.join(process.cwd(), "content/projects");
const defaultReaders = makeReaders(DEFAULT_BLOG_DIR, DEFAULT_PROJECTS_DIR);

export const getAllPosts = defaultReaders.getAllPosts;
export const getPostBySlug = defaultReaders.getPostBySlug;
export const getAllProjects = defaultReaders.getAllProjects;
export const getProjectBySlug = defaultReaders.getProjectBySlug;

// For testing — allows injecting custom dirs
export const __setupWithDirs = makeReaders;
```

- [ ] **Run tests — expect pass**

```bash
npm test -- --testPathPattern="__tests__/lib/mdx"
```

Expected: PASS — 6 tests passing.

- [ ] **Commit**

```bash
git add lib/mdx.ts __tests__/lib/mdx.test.ts
git commit -m "feat: add lib/mdx.ts — MDX content reader with tests"
```

---

## Task 4: `lib/metadata.ts` — SEO Helper (TDD)

**Files:**
- Create: `lib/metadata.ts`
- Test: `__tests__/lib/metadata.test.ts`

- [ ] **Write failing tests**

```typescript
// __tests__/lib/metadata.test.ts
import { generatePageMetadata } from "@/lib/metadata";

describe("generatePageMetadata", () => {
  it("builds metadata with title and description", () => {
    const meta = generatePageMetadata({
      title: "Blog",
      description: "My posts",
    });
    expect(meta.title).toBe("Blog | Tu Nombre");
    expect(meta.description).toBe("My posts");
  });

  it("includes OpenGraph fields", () => {
    const meta = generatePageMetadata({ title: "Home", description: "Personal site" });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.title).toBe("Home | Tu Nombre");
    expect(og.url).toContain("https://");
  });

  it("uses site name as fallback title when no title given", () => {
    const meta = generatePageMetadata({ description: "Personal page" });
    expect(meta.title).toBe("Tu Nombre");
  });
});
```

- [ ] **Run — expect failure**

```bash
npm test -- --testPathPattern="__tests__/lib/metadata"
```

Expected: FAIL — `Cannot find module '@/lib/metadata'`

- [ ] **Implement `lib/metadata.ts`**

```typescript
import type { Metadata } from "next";
import { site } from "./site.config";

interface PageMetaInput {
  title?: string;
  description: string;
  image?: string;
}

export function generatePageMetadata({ title, description, image }: PageMetaInput): Metadata {
  const fullTitle = title ? `${title} | ${site.name}` : site.name;
  const ogImage = image ?? `${site.url}/og.png`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(site.url),
    openGraph: {
      title: fullTitle,
      description,
      url: site.url,
      siteName: site.name,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
      ...(site.twitter ? { creator: `@${site.twitter}` } : {}),
    },
  };
}
```

- [ ] **Run — expect pass**

```bash
npm test -- --testPathPattern="__tests__/lib/metadata"
```

Expected: PASS — 3 tests.

- [ ] **Commit**

```bash
git add lib/metadata.ts __tests__/lib/metadata.test.ts
git commit -m "feat: add lib/metadata.ts — SEO helper with tests"
```

---

## Task 5: Global Styles + Dark/Light Mode

**Files:**
- Modify: `app/globals.css`
- Create: `components/ui/ThemeToggle.tsx`
- Test: `__tests__/components/ui/ThemeToggle.test.tsx`

- [ ] **Write failing test for ThemeToggle**

```typescript
// __tests__/components/ui/ThemeToggle.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// next-themes requires a Provider in tests
jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn(), resolvedTheme: "light" }),
}));

describe("ThemeToggle", () => {
  it("renders a button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls setTheme with dark when current theme is light", async () => {
    const setTheme = jest.fn();
    jest.mocked(require("next-themes").useTheme).mockReturnValue({
      resolvedTheme: "light",
      setTheme,
      theme: "light",
    });
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
```

- [ ] **Run — expect failure**

```bash
npm test -- --testPathPattern="ThemeToggle"
```

Expected: FAIL — `Cannot find module '@/components/ui/ThemeToggle'`

- [ ] **Define CSS custom properties in `app/globals.css`**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 217 91% 60%;
  --border: 214 32% 91%;
}

.dark {
  --background: 222 47% 8%;
  --foreground: 210 40% 96%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 213 94% 68%;
  --border: 217 33% 20%;
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

- [ ] **Implement `components/ui/ThemeToggle.tsx`**

```typescript
"use client";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="rounded-md p-2 text-sm transition-colors hover:bg-[hsl(var(--muted))]"
    >
      {resolvedTheme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
```

- [ ] **Run — expect pass**

```bash
npm test -- --testPathPattern="ThemeToggle"
```

Expected: PASS — 2 tests.

- [ ] **Commit**

```bash
git add app/globals.css components/ui/ThemeToggle.tsx __tests__/components/ui/ThemeToggle.test.tsx
git commit -m "feat: add global CSS tokens and ThemeToggle component"
```

---

## Task 6: Layout — Header, Nav, Footer

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/layout/Header.tsx`, `components/layout/Nav.tsx`, `components/layout/Footer.tsx`

- [ ] **Implement `components/layout/Nav.tsx`**

```typescript
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-6">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-sm transition-colors hover:text-[hsl(var(--accent))] ${
            pathname === href
              ? "font-semibold text-[hsl(var(--accent))]"
              : "text-[hsl(var(--muted-foreground))]"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Implement `components/layout/Header.tsx`**

```typescript
import Link from "next/link";
import { Nav } from "./Nav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { site } from "@/lib/site.config";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          {site.name}
        </Link>
        <div className="flex items-center gap-4">
          <Nav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Implement `components/layout/Footer.tsx`**

```typescript
import { site } from "@/lib/site.config";

export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
      <p>
        © {new Date().getFullYear()} {site.name} ·{" "}
        <a
          href={`https://github.com/${site.github}`}
          className="hover:text-[hsl(var(--accent))] transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </p>
    </footer>
  );
}
```

- [ ] **Update `app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { site } from "@/lib/site.config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.bio,
  metadataBase: new URL(site.url),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">{children}</main>
          <Footer />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
```

- [ ] **Commit**

```bash
git add app/layout.tsx components/layout/
git commit -m "feat: add layout components — Header, Nav, Footer"
```

---

## Task 7: Home Page

**Files:**
- Modify: `app/page.tsx`
- Create: `components/blog/PostCard.tsx`, `components/projects/ProjectCard.tsx`

- [ ] **Write tests for PostCard**

```typescript
// __tests__/components/blog/PostCard.test.tsx
import { render, screen } from "@testing-library/react";
import { PostCard } from "@/components/blog/PostCard";

const post = {
  title: "Hello World",
  date: "2026-01-15",
  description: "My first post",
  tags: ["nextjs"],
  draft: false,
  slug: "hello-world",
};

describe("PostCard", () => {
  it("renders post title as a link", () => {
    render(<PostCard post={post} />);
    expect(screen.getByRole("link", { name: "Hello World" })).toHaveAttribute(
      "href",
      "/blog/hello-world"
    );
  });

  it("renders description and date", () => {
    render(<PostCard post={post} />);
    expect(screen.getByText("My first post")).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });
});
```

- [ ] **Run — expect failure**, then implement `components/blog/PostCard.tsx`

```typescript
import Link from "next/link";
import type { PostMeta } from "@/lib/mdx";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="group border-b border-[hsl(var(--border))] py-6 last:border-0">
      <time className="text-xs text-[hsl(var(--muted-foreground))]">
        {new Date(post.date).toLocaleDateString("es", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
      <h2 className="mt-1 text-lg font-semibold group-hover:text-[hsl(var(--accent))] transition-colors">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{post.description}</p>
    </article>
  );
}
```

- [ ] **Run PostCard tests — expect pass**

```bash
npm test -- --testPathPattern="PostCard"
```

Expected: PASS — 2 tests.

- [ ] **Implement `components/projects/ProjectCard.tsx`**

```typescript
import type { ProjectMeta } from "@/lib/mdx";

export function ProjectCard({ project }: { project: ProjectMeta }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] p-5 transition-shadow hover:shadow-md">
      <h3 className="font-semibold">{project.title}</h3>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{project.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {project.tech.map((t) => (
          <span
            key={t}
            className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-medium"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-3 text-sm">
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer"
            className="text-[hsl(var(--accent))] hover:underline">
            GitHub ↗
          </a>
        )}
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer"
            className="text-[hsl(var(--accent))] hover:underline">
            Live ↗
          </a>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Implement `app/page.tsx`**

```typescript
import Link from "next/link";
import { PostCard } from "@/components/blog/PostCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getAllPosts, getAllProjects } from "@/lib/mdx";
import { site } from "@/lib/site.config";

export default function HomePage() {
  const recentPosts = getAllPosts().slice(0, 3);
  const featuredProjects = getAllProjects().filter((p) => p.featured);

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section>
        <h1 className="text-4xl font-bold tracking-tight">{site.name}</h1>
        <p className="mt-4 max-w-2xl text-lg text-[hsl(var(--muted-foreground))]">{site.bio}</p>
        <div className="mt-6 flex gap-4 text-sm">
          <a href={`https://github.com/${site.github}`} target="_blank" rel="noopener noreferrer"
            className="text-[hsl(var(--accent))] hover:underline">GitHub ↗</a>
          {site.linkedin && (
            <a href={`https://linkedin.com/in/${site.linkedin}`} target="_blank" rel="noopener noreferrer"
              className="text-[hsl(var(--accent))] hover:underline">LinkedIn ↗</a>
          )}
        </div>
      </section>

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Últimos artículos</h2>
            <Link href="/blog" className="text-sm text-[hsl(var(--accent))] hover:underline">Ver todos →</Link>
          </div>
          <div>
            {recentPosts.map((post) => <PostCard key={post.slug} post={post} />)}
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Proyectos destacados</h2>
            <Link href="/projects" className="text-sm text-[hsl(var(--accent))] hover:underline">Ver todos →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredProjects.map((p) => <ProjectCard key={p.slug} project={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add app/page.tsx components/blog/PostCard.tsx components/projects/ProjectCard.tsx __tests__/components/
git commit -m "feat: add Home page with PostCard and ProjectCard"
```

---

## Task 8: About Page

**Files:**
- Create: `app/about/page.tsx`

- [ ] **Implement `app/about/page.tsx`**

```typescript
import { generatePageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site.config";

export const metadata = generatePageMetadata({
  title: "About",
  description: `Conoce más sobre ${site.name}`,
});

export default function AboutPage() {
  return (
    <div className="max-w-2xl space-y-12">
      <section>
        <h1 className="text-3xl font-bold">About</h1>
        <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
          {/* Edita este texto con tu historia */}
          Hola, soy {site.name}. {site.bio}
        </p>
        <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
          Aquí va tu historia, lo que te apasiona, y cómo llegaste al desarrollo de software.
          Edita directamente este archivo en <code>app/about/page.tsx</code>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Skills</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {site.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-[hsl(var(--border))] px-3 py-1 text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Contacto</h2>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <a href={`https://github.com/${site.github}`} target="_blank" rel="noopener noreferrer"
            className="text-[hsl(var(--accent))] hover:underline">GitHub: @{site.github}</a>
          {site.linkedin && (
            <a href={`https://linkedin.com/in/${site.linkedin}`} target="_blank" rel="noopener noreferrer"
              className="text-[hsl(var(--accent))] hover:underline">LinkedIn: {site.linkedin}</a>
          )}
          {site.twitter && (
            <a href={`https://twitter.com/${site.twitter}`} target="_blank" rel="noopener noreferrer"
              className="text-[hsl(var(--accent))] hover:underline">Twitter: @{site.twitter}</a>
          )}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add app/about/
git commit -m "feat: add About page with skills and social links"
```

---

## Task 9: Blog Pages

**Files:**
- Create: `app/blog/page.tsx` (Server Component — pasa posts a BlogList)
- Create: `components/blog/BlogList.tsx` (Client Component — tag filter con useState)
- Create: `app/blog/[slug]/page.tsx`, `components/blog/TagBadge.tsx`, `components/blog/PostContent.tsx`
- Test: `__tests__/components/blog/TagBadge.test.tsx`

> **Nota de arquitectura:** `getAllPosts()` usa `fs` (Node.js) y solo puede llamarse en Server Components. El filtro por tag requiere `useState` (Client Component). La solución es separar: `app/blog/page.tsx` llama `getAllPosts()` en el servidor y pasa el resultado como prop a `BlogList` (client).

- [ ] **Write TagBadge test**

```typescript
// __tests__/components/blog/TagBadge.test.tsx
import { render, screen } from "@testing-library/react";
import { TagBadge } from "@/components/blog/TagBadge";

describe("TagBadge", () => {
  it("renders the tag text", () => {
    render(<TagBadge tag="nextjs" />);
    expect(screen.getByText("nextjs")).toBeInTheDocument();
  });

  it("links to blog with tag filter when href given", () => {
    render(<TagBadge tag="nextjs" href="/blog?tag=nextjs" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/blog?tag=nextjs");
  });
});
```

- [ ] **Run — expect failure**, then implement `components/blog/TagBadge.tsx`

```typescript
import Link from "next/link";

interface TagBadgeProps {
  tag: string;
  href?: string;
}

export function TagBadge({ tag, href }: TagBadgeProps) {
  const className =
    "rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]/10 hover:text-[hsl(var(--accent))] transition-colors";

  if (href) return <Link href={href} className={className}>{tag}</Link>;
  return <span className={className}>{tag}</span>;
}
```

- [ ] **Run TagBadge tests — expect pass**

```bash
npm test -- --testPathPattern="TagBadge"
```

Expected: PASS — 2 tests.

- [ ] **Implement `components/blog/PostContent.tsx`**

```typescript
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      [rehypePrettyCode, { theme: { dark: "github-dark", light: "github-light" } }],
    ],
  },
};

export function PostContent({ source }: { source: string }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <MDXRemote source={source} options={mdxOptions as Parameters<typeof MDXRemote>[0]["options"]} />
    </div>
  );
}
```

- [ ] **Implement `components/blog/BlogList.tsx`** (Client Component — maneja filtro)

```typescript
"use client";
import { useState, useMemo } from "react";
import { PostCard } from "@/components/blog/PostCard";
import type { PostMeta } from "@/lib/mdx";

export function BlogList({ posts }: { posts: PostMeta[] }) {
  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((p) => p.tags))).sort(),
    [posts]
  );
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const filtered = activeTag ? posts.filter((p) => p.tags.includes(activeTag)) : posts;

  return (
    <>
      {allTags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !activeTag
                ? "bg-[hsl(var(--accent))] text-white"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]/10"
            }`}
          >
            Todos
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tag === activeTag
                  ? "bg-[hsl(var(--accent))] text-white"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]/10"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      <div className="mt-8">
        {filtered.length === 0 ? (
          <p className="text-[hsl(var(--muted-foreground))]">No hay posts con ese tag.</p>
        ) : (
          filtered.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </div>
    </>
  );
}
```

- [ ] **Implement `app/blog/page.tsx`** (Server Component — lee MDX y exporta metadata)

```typescript
import { getAllPosts } from "@/lib/mdx";
import { generatePageMetadata } from "@/lib/metadata";
import { BlogList } from "@/components/blog/BlogList";

export const metadata = generatePageMetadata({
  title: "Blog",
  description: "Artículos sobre desarrollo de software, IA, y aprendizaje continuo.",
});

export default function BlogPage() {
  const posts = getAllPosts(); // ← ejecuta en servidor, usa fs
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold">Blog</h1>
      <BlogList posts={posts} />
    </div>
  );
}
```

- [ ] **Implement `app/blog/[slug]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/mdx";
import { generatePageMetadata } from "@/lib/metadata";
import { PostContent } from "@/components/blog/PostContent";
import { TagBadge } from "@/components/blog/TagBadge";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return generatePageMetadata({ title: post.title, description: post.description });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="max-w-2xl">
      <header className="mb-8">
        <time className="text-sm text-[hsl(var(--muted-foreground))]">
          {new Date(post.date).toLocaleDateString("es", {
            year: "numeric", month: "long", day: "numeric",
          })}
        </time>
        <h1 className="mt-2 text-3xl font-bold">{post.title}</h1>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
          </div>
        )}
      </header>
      <PostContent source={post.content} />
    </article>
  );
}
```

- [ ] **Commit**

```bash
git add app/blog/ components/blog/ __tests__/components/blog/
git commit -m "feat: add Blog list and post pages with MDX rendering"
```

---

## Task 10: Projects Page

**Files:**
- Create: `app/projects/page.tsx`

- [ ] **Implement `app/projects/page.tsx`**

```typescript
import { getAllProjects } from "@/lib/mdx";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Projects",
  description: "Proyectos y trabajo open source",
});

export default function ProjectsPage() {
  const projects = getAllProjects();
  return (
    <div>
      <h1 className="text-3xl font-bold">Projects</h1>
      <p className="mt-4 text-[hsl(var(--muted-foreground))]">
        Proyectos que he construido — personales, open source, y trabajos destacados.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add app/projects/
git commit -m "feat: add Projects page"
```

---

## Task 11: Contact Page + API Route

**Files:**
- Create: `app/contact/page.tsx` (Server Component — exporta metadata)
- Create: `components/ContactForm.tsx` (Client Component — maneja estado del form)
- Create: `app/api/contact/route.ts`

> **Nota:** `metadata` no puede exportarse desde Client Components. `app/contact/page.tsx` es un Server Component que renderiza `<ContactForm />` (el componente con `useState`).

- [ ] **Implement `app/api/contact/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/lib/site.config";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.name || !body.email || !body.message) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  const { name, email, message } = body as { name: string; email: string; message: string };

  if (!process.env.RESEND_API_KEY) {
    // Graceful degradation — log server-side, respond success to client
    console.warn("[contact] RESEND_API_KEY not set — email not sent");
    return NextResponse.json({ success: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: `contact@${new URL(site.url).hostname}`,
    to: site.email,
    replyTo: email,
    subject: `Mensaje de ${name} vía ${site.name}`,
    text: `De: ${name} <${email}>\n\n${message}`,
  });

  if (error) {
    console.error("[contact] Resend error:", error);
    return NextResponse.json({ error: "No se pudo enviar el mensaje" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Implement `components/ContactForm.tsx`** (Client Component)

```typescript
"use client";
import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setStatus(res.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        ✓ Mensaje enviado. Te respondo pronto.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input name="name" required
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input name="email" type="email" required
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Mensaje</label>
        <textarea name="message" required rows={5}
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] resize-none" />
      </div>
      {status === "error" && (
        <p className="text-sm text-red-500">No se pudo enviar. Intenta de nuevo.</p>
      )}
      <button type="submit" disabled={status === "sending"}
        className="w-full rounded-lg bg-[hsl(var(--accent))] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
        {status === "sending" ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
```

- [ ] **Implement `app/contact/page.tsx`** (Server Component — exporta metadata)

```typescript
import { generatePageMetadata } from "@/lib/metadata";
import { ContactForm } from "@/components/ContactForm";

export const metadata = generatePageMetadata({
  title: "Contact",
  description: "Escríbeme — respondo a todas las consultas.",
});

export default function ContactPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="mt-4 text-[hsl(var(--muted-foreground))]">
        ¿Tienes una pregunta o quieres trabajar juntos? Escríbeme.
      </p>
      <ContactForm />
    </div>
  );
}
```

- [ ] **Create `.env.example`**

```bash
# .env.example — copy to .env.local and fill in values
# Required only for the contact form. The site works without it.
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

- [ ] **Commit**

```bash
git add app/contact/ app/api/contact/ .env.example
git commit -m "feat: add Contact page and Resend API route with graceful degradation"
```

---

## Task 12: SEO — Sitemap + robots.txt + RSS

**Files:**
- Create: `app/sitemap.ts`, `app/rss.xml/route.ts`, `public/robots.txt`, `public/og.png`

- [ ] **Implement `app/sitemap.ts`**

```typescript
import { MetadataRoute } from "next";
import { getAllPosts, getAllProjects } from "@/lib/mdx";
import { site } from "@/lib/site.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const staticPages = ["/", "/about", "/blog", "/projects", "/contact"].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  return [...staticPages, ...posts];
}
```

- [ ] **Implement `app/rss.xml/route.ts`**

```typescript
import { Feed } from "feed";
import { getAllPosts } from "@/lib/mdx";
import { site } from "@/lib/site.config";

export async function GET() {
  const feed = new Feed({
    title: site.name,
    description: site.bio,
    id: site.url,
    link: site.url,
    language: "es",
    author: { name: site.name, email: site.email, link: site.url },
    copyright: `© ${new Date().getFullYear()} ${site.name}`,
  });

  getAllPosts().forEach((post) => {
    feed.addItem({
      title: post.title,
      id: `${site.url}/blog/${post.slug}`,
      link: `${site.url}/blog/${post.slug}`,
      description: post.description,
      date: new Date(post.date),
    });
  });

  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
```

- [ ] **Create `public/robots.txt`**

```
User-agent: *
Allow: /
Sitemap: https://tunombre.com/sitemap.xml
```

- [ ] **Create `vercel.json`** with security headers

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

- [ ] **Add placeholder OG image**

Place a 1200×630px image at `public/og.png` — can be a simple screenshot of the site later.

- [ ] **Commit**

```bash
git add app/sitemap.ts app/rss.xml/ public/ vercel.json
git commit -m "feat: add sitemap, RSS feed, robots.txt, and security headers"
```

---

## Task 13: Sample Content

**Files:**
- Create: `content/blog/hello-world.mdx`, `content/projects/personal-page.mdx`, `content/projects/songosorhongo.mdx`

- [ ] **Create `content/blog/hello-world.mdx`**

```mdx
---
title: "Bienvenido a mi página personal"
date: "2026-06-02"
description: "Por qué construí esta página y qué puedes esperar encontrar aquí."
tags: [personal, nextjs, webdev]
---

## Por qué esta página

Construí esta página como un espacio propio en internet donde puedo escribir sobre lo que aprendo,
mostrar mis proyectos, y experimentar con nuevas tecnologías.

## El stack

Este sitio está construido con **Next.js 15**, **TypeScript**, y **Tailwind CSS 4**.
El contenido del blog vive como archivos `.mdx` en el repo — sin CMS, sin base de datos.

```bash
# Clonar y correr localmente
git clone https://github.com/serandmoncas/PersonalPage
npm install && npm run dev
```

Si quieres construir el tuyo, puedes usar este mismo template.
Aprende cómo en [sergiomonsalve.com/cursos](https://sergiomonsalve.com/cursos).
```

- [ ] **Create `content/projects/personal-page.mdx`**

```mdx
---
title: "Personal Page Template"
description: "Template open-source para construir tu página personal con Next.js 15, MDX y Vercel."
tech: [nextjs, typescript, tailwind, mdx, vercel]
github: https://github.com/serandmoncas/PersonalPage
featured: true
order: 1
---

Template educativo para que cualquier persona pueda construir y publicar su página personal.
Incluye blog, portafolio, formulario de contacto y deploy automático en Vercel.
```

- [ ] **Create `content/projects/songosorhongo.mdx`**

```mdx
---
title: "Songo Sorhongo"
description: "Sitio web y sistema de gestión para una empresa de fungicultura en Colombia. Next.js + FastAPI + PostgreSQL."
tech: [nextjs, fastapi, postgresql, typescript, railway]
github: https://github.com/serandmoncas/songosorhongo.com
url: https://songosorhongo.com
featured: true
order: 2
---

Plataforma completa: vitrina de negocio con catálogo de productos, cotizaciones,
y panel interno de gestión (inventario, usuarios, cursos). Patrón full-stack
Next.js + FastAPI + Railway, desplegado 100% en free tier.
```

- [ ] **Verify dev server shows content**

```bash
npm run dev
```

Navigate to `http://localhost:3000` — should show 1 post and 2 projects.

- [ ] **Commit**

```bash
git add content/
git commit -m "content: add sample blog post and two example projects"
```

---

## Task 14: E2E Tests (Playwright)

**Files:**
- Create: `e2e/navigation.spec.ts`, `e2e/blog.spec.ts`, `e2e/contact.spec.ts`

- [ ] **Write `e2e/navigation.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page loads with hero text", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("nav links go to correct pages", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Blog" }).click();
    await expect(page).toHaveURL("/blog");
    await expect(page.getByRole("heading", { name: "Blog" })).toBeVisible();
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: "About" })).toBeVisible();
    await expect(page.getByText("Skills")).toBeVisible();
  });

  test("projects page loads", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("theme toggle changes theme", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const toggle = page.getByRole("button", { name: /toggle theme/i });
    await toggle.click();
    await expect(html).toHaveClass(/dark/);
    await toggle.click();
    await expect(html).not.toHaveClass(/dark/);
  });
});
```

- [ ] **Write `e2e/blog.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Blog", () => {
  test("shows post list", async ({ page }) => {
    await page.goto("/blog");
    // At least 1 post from sample content
    const articles = page.locator("article");
    await expect(articles).toHaveCount(1);
  });

  test("navigates to post detail", async ({ page }) => {
    await page.goto("/blog");
    await page.getByRole("link", { name: /bienvenido/i }).click();
    await expect(page).toHaveURL(/\/blog\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("tag filter shows relevant posts", async ({ page }) => {
    await page.goto("/blog");
    const tagButton = page.getByRole("button", { name: "nextjs" });
    if (await tagButton.isVisible()) {
      await tagButton.click();
      const articles = page.locator("article");
      await expect(articles).toHaveCount(1);
    }
  });
});
```

- [ ] **Write `e2e/contact.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Contact", () => {
  test("contact page has form", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /nombre/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  });

  test("form validation: empty submission blocked by browser", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: /enviar/i }).click();
    // HTML5 required prevents submission — form stays visible
    await expect(page.getByRole("button", { name: /enviar/i })).toBeVisible();
  });
});
```

- [ ] **Run E2E locally (requires build first)**

```bash
npm run build && npm run start &
npx playwright test
```

Expected: all E2E tests pass. Kill the server after (`kill %1`).

- [ ] **Commit**

```bash
git add e2e/
git commit -m "test: add Playwright E2E tests for navigation, blog, and contact"
```

---

## Task 15: CI/CD — GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Quality checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm test -- --ci --coverage
        env:
          CI: true

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Build production
        run: npm run build
        env:
          NEXT_PUBLIC_SITE_URL: https://example.com

  e2e:
    name: E2E tests
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SITE_URL: http://localhost:3000

      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Commit and push to trigger CI**

```bash
git add .github/
git commit -m "ci: add GitHub Actions workflow — quality, build, E2E"
git push origin main
```

Expected: CI pipeline passes on GitHub Actions (check Actions tab).

---

## Task 16: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Rewrite `CLAUDE.md`** with actual commands now that the stack is defined

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`PersonalPage` — template educativo Next.js 15 para páginas personales y portafolios.
Rama `main`: stack básico (frontend estático + Vercel free). Ver `docs/superpowers/specs/` para el diseño completo.

## Commands

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # build de producción
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm test             # Jest unit tests
npm run test:watch   # Jest en modo watch
npm run test:coverage # Jest con cobertura
npm run test:e2e     # Playwright E2E (requiere npm run build primero)
```

## Architecture

```
lib/site.config.ts   ← único archivo que el usuario edita primero (nombre, bio, links)
lib/mdx.ts           ← lee archivos .mdx de content/ con gray-matter
lib/metadata.ts      ← helper generatePageMetadata() para SEO
content/blog/        ← posts del blog como archivos .mdx
content/projects/    ← proyectos del portafolio como archivos .mdx
app/                 ← Next.js App Router pages
components/          ← UI dividida por dominio: layout/, blog/, projects/, ui/
__tests__/           ← Jest unit tests (espejo de lib/ y components/)
e2e/                 ← Playwright E2E tests
```

## Frontmatter

Blog posts (`content/blog/*.mdx`):
```yaml
title: string
date: YYYY-MM-DD
description: string
tags: string[]
draft?: boolean   # omite el post del build si true
```

Projects (`content/projects/*.mdx`):
```yaml
title: string
description: string
tech: string[]
url?: string
github?: string
featured?: boolean  # aparece en Home
order?: number      # orden en la lista (menor = primero)
```

## Branch Strategy

| Rama | Stack añadido |
|------|--------------|
| `main` | Next.js 15 + Tailwind + MDX (este branch) |
| `stack/nextjs-fastapi-railway` | + FastAPI + PostgreSQL + Railway |
| `stack/nextjs-supabase` | + Supabase BaaS |
| `stack/astro-vercel` | Astro (reescritura completa) |

## Key Conventions

- Todo el sitio se alimenta de `lib/site.config.ts` — editarlo primero.
- No hay base de datos en `main` — el contenido vive en archivos locales.
- RESEND_API_KEY es el único env var — el sitio funciona sin él (el form falla silenciosamente).
- Tests primero para `lib/` — las funciones de lectura de MDX tienen cobertura completa.
```

- [ ] **Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with actual stack, commands, and conventions"
```

---

## Task 17: Deploy — Vercel

Estos pasos son manuales (no automatizables en CI). Documentarlos en el README y en el curso.

- [ ] **Instalar Vercel CLI (una vez)**

```bash
npm install -g vercel
```

- [ ] **Login en Vercel**

```bash
vercel login
```

- [ ] **Deploy preview**

```bash
vercel
```

Expected: URL de preview como `https://personal-page-xxxxx.vercel.app`

- [ ] **Deploy a producción**

```bash
vercel --prod
```

Expected: el sitio queda en la URL configurada (o en `*.vercel.app` si no tienes dominio propio aún).

- [ ] **Conectar repo a Vercel (para deploys automáticos)**

En el dashboard de Vercel: Import Project → seleccionar repo → Framework: Next.js (auto-detectado) → Deploy.

A partir de aquí, cada push a `main` despliega automáticamente. Cada PR genera un preview URL.

- [ ] **Agregar env var (opcional — para el formulario de contacto)**

En Vercel Dashboard → Settings → Environment Variables:
```
RESEND_API_KEY = re_xxxxxx
```

---

---

## Guías de Implementación — Ramas de Stack

Cada rama parte de `main` y agrega complejidad progresiva. Construirlas en orden: `main` estable primero.

---

### Rama `stack/nextjs-fastapi-railway`

**Propósito:** Enseñar el patrón full-stack con FastAPI + PostgreSQL (igual al patrón de songosorhongo.com).

**Cuándo usarla:** El estudiante quiere features dinámicas: newsletter, comentarios, auth, dashboard de analytics propio.

**Partir de main:**
```bash
git checkout main
git checkout -b stack/nextjs-fastapi-railway
```

**Agregar al repo:**

```
backend/
├── app/
│   ├── main.py          ← FastAPI app + CORS configurado para el frontend
│   ├── database.py      ← SQLAlchemy 2 + get_db dependency
│   ├── models/
│   │   └── subscriber.py ← modelo para newsletter
│   ├── schemas/
│   │   └── subscriber.py ← Pydantic v2
│   ├── routers/
│   │   └── newsletter.py ← POST /api/newsletter/subscribe
│   └── services/
│       └── newsletter.py ← lógica de suscripción (evitar duplicados)
├── alembic/             ← migraciones
├── tests/               ← pytest + httpx
├── requirements.txt
├── Dockerfile
└── railway.toml
```

**Frontend — cambios sobre `main`:**

- Reemplazar `app/api/contact/route.ts` con llamada al backend FastAPI
- Agregar `app/api/newsletter/route.ts` como proxy al backend
- Agregar `NewsletterForm` component en el Footer

**Variables de entorno nuevas:**
```bash
# .env.local (frontend)
NEXT_PUBLIC_API_URL=http://localhost:8000   # dev
NEXT_PUBLIC_API_URL=https://api.tunombre.com  # prod

# backend .env
DATABASE_URL=postgresql://user:pass@host/db
```

**Deploy:**

1. **Backend en Railway:**
   - Crear nuevo proyecto Railway → New Service → GitHub Repo → seleccionar rama
   - Railway detecta `railway.toml` — configura auto-deploy
   - Agregar variable `DATABASE_URL` (Railway provee PostgreSQL en el mismo proyecto)
   - El servicio queda en `https://personal-page-api.up.railway.app`

2. **Frontend en Vercel:**
   - Agregar `NEXT_PUBLIC_API_URL` en Vercel Settings → Environment Variables

**`railway.toml`:**
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
```

**Tests a agregar:**
```bash
# backend/
pytest tests/ -v                # unit tests con httpx TestClient
pytest tests/ --cov=app         # con cobertura
```

**CI — agregar job en `.github/workflows/ci.yml`:**
```yaml
backend-tests:
  name: Backend tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with: { python-version: "3.12" }
    - run: pip install -r backend/requirements.txt
    - run: pytest backend/tests/ -v
      env:
        DATABASE_URL: sqlite:///./test.db  # SQLite en CI
```

---

### Rama `stack/nextjs-supabase`

**Propósito:** Enseñar el patrón BaaS (Backend as a Service) — auth, DB, y storage sin escribir un backend propio.

**Cuándo usarla:** El estudiante quiere features dinámicas más rápido, sin aprender Python/FastAPI.

**Partir de main:**
```bash
git checkout main
git checkout -b stack/nextjs-supabase
```

**Dependencias nuevas:**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Agregar al repo:**

```
lib/
├── supabase/
│   ├── client.ts        ← createBrowserClient() para Client Components
│   └── server.ts        ← createServerClient() para Server Components y API Routes
```

**`lib/supabase/client.ts`:**
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Features que añade sobre `main`:**

| Feature | Implementación Supabase |
|---------|------------------------|
| Newsletter | Tabla `subscribers` en Supabase, insertar vía API Route |
| Guestbook | Tabla `messages`, auth anónima de Supabase |
| Views counter | Tabla `page_views`, incrementar en cada visita |
| Contact form | Edge Function de Supabase como alternativa a Resend |

**Variables de entorno:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # solo en el servidor — no exponer
```

**Deploy:**

1. Crear proyecto en supabase.com (free tier: 500MB DB, 1GB storage)
2. Copiar `SUPABASE_URL` y `ANON_KEY` desde Settings → API
3. Agregar las variables en Vercel Settings → Environment Variables
4. Sin backend adicional — Supabase actúa como el servidor

**Tests a agregar:**
```typescript
// __tests__/lib/supabase/newsletter.test.ts
// Mock @supabase/supabase-js y testear la lógica de suscripción
jest.mock("@supabase/ssr", () => ({
  createBrowserClient: () => ({
    from: () => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));
```

---

### Rama `stack/astro-vercel`

**Propósito:** Mostrar una alternativa a Next.js con mejor rendimiento para sitios de contenido estático.

**Cuándo usarla:** El estudiante prioriza Core Web Vitals perfectos y no necesita features dinámicas complejas.

**Esta rama es una reescritura completa — NO parte de `main`:**
```bash
git checkout --orphan stack/astro-vercel
git rm -rf .
```

**Scaffold:**
```bash
npm create astro@latest . -- \
  --template minimal \
  --typescript strict \
  --no-install
npm install
npm install @astrojs/tailwind @astrojs/mdx tailwindcss @tailwindcss/typography
```

**Estructura equivalente a `main`:**
```
src/
├── layouts/
│   └── Layout.astro      ← equivalente a app/layout.tsx
├── pages/
│   ├── index.astro       ← Home
│   ├── about.astro       ← About
│   ├── blog/
│   │   ├── index.astro   ← Blog list
│   │   └── [slug].astro  ← Blog post
│   ├── projects.astro    ← Projects
│   └── contact.astro     ← Contact (form sin backend — Netlify Forms o formspree)
├── components/
│   ├── Header.astro
│   ├── PostCard.astro
│   └── ProjectCard.astro
└── content/
    ├── blog/             ← .md/.mdx files (Astro Content Collections)
    └── projects/         ← .md/.mdx files
```

**Diferencia clave con `main`:** Astro usa Content Collections (tipo-seguro nativo) en lugar de `gray-matter` manual:

```typescript
// src/content/config.ts
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.string().array().default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

**Deploy:**
```bash
npm install @astrojs/vercel
```

En `astro.config.mjs`:
```javascript
import vercel from "@astrojs/vercel/static";
export default defineConfig({
  output: "static",
  adapter: vercel(),
});
```

Deploy igual que `main`: `vercel --prod`.

**Tests:**
```bash
npm install -D @playwright/test
# Playwright E2E — mismos tests que en main (copiar e2e/ y ajustar selectores)
```

---

## Backlog — Tareas Futuras

Ordenadas por impacto estimado. No forman parte del plan actual.

### Alta prioridad (próximo ciclo)

- [ ] **OG images dinámicas** — `@vercel/og` para generar imágenes Open Graph con título y fecha del post. Archivo: `app/blog/[slug]/opengraph-image.tsx`.
- [ ] **Newsletter con Resend** — formulario de suscripción en Footer que llama a `/api/newsletter`. Rama: `main` (Resend ya es dependencia).
- [ ] **Búsqueda con Pagefind** — indexado estático en build time, sin API key ni servidor. Compatible con deploy en Vercel free.
- [ ] **Tabla de contenidos** — `rehype-slug` + `rehype-autolink-headings` en los posts del blog. Componente `TableOfContents.tsx` que lee los headings.

### Media prioridad

- [ ] **Comentarios con Giscus** — GitHub Discussions como backend de comentarios. Zero costo, requiere repo público.
- [ ] **Modo lectura** — tipografía optimizada para posts largos (fuente serifada, línea ancha reducida).
- [ ] **GitHub stats en About** — API pública de GitHub para mostrar repos, contribuciones y lenguajes. Sin auth requerida.
- [ ] **Animaciones con Framer Motion** — transiciones de página y stagger en listas de posts/proyectos.

### Baja prioridad / investigación

- [ ] **i18n (ES/EN)** — `next-intl` o routing manual con prefijo de locale. Solo si el estudiante tiene audiencia bilingüe.
- [ ] **CMS headless opcional** — guía de integración con Sanity Studio o Tina CMS para quien no quiera editar MDX.
- [ ] **Analytics propio** — rama `stack/nextjs-fastapi-railway` podría incluir tabla `page_views` como alternativa a Vercel Analytics.
- [ ] **PWA** — `next-pwa` para installable app. Agrega complejidad; solo vale para blogs con audiencia fiel.
- [ ] **Rama `stack/remix-fly`** — variante con Remix + Fly.io. Interesante para mostrar el ecosistema Remix.

### Contenido del curso (sergiomonsalve.com)

- [ ] Escribir lecciones MDX del Módulo 1: Setup & Herramientas
- [ ] Escribir lecciones MDX del Módulo 2: El Template Base
- [ ] Grabar videos de cada módulo (YouTube unlisted → Resend API en sergiomonsalve.com)
- [ ] Crear seed script para cargar el curso en la BD de sergiomonsalve.com
