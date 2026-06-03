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
