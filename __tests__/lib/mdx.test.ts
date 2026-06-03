import fs from "fs";
import path from "path";

const FIXTURES_DIR = path.join(__dirname, "fixtures");

// Setup: create temp fixture files before tests
beforeAll(() => {
  fs.mkdirSync(path.join(FIXTURES_DIR, "blog"), { recursive: true });
  fs.mkdirSync(path.join(FIXTURES_DIR, "projects"), { recursive: true });

  fs.writeFileSync(
    path.join(FIXTURES_DIR, "blog", "hello-world.mdx"),
    `---\ntitle: Hello World\ndate: 2026-01-15\ndescription: My first post\ntags:\n  - nextjs\n  - typescript\n---\n\n# Hello\n\nContent here.`
  );
  fs.writeFileSync(
    path.join(FIXTURES_DIR, "blog", "draft-post.mdx"),
    `---\ntitle: Draft\ndate: 2026-01-20\ndescription: Not published\ntags: []\ndraft: true\n---\n\nDraft content.`
  );
  fs.writeFileSync(
    path.join(FIXTURES_DIR, "projects", "my-project.mdx"),
    `---\ntitle: My Project\ndescription: A cool project\ntech:\n  - nextjs\n  - tailwind\ngithub: https://github.com/user/project\nfeatured: true\norder: 1\n---\n\nProject details.`
  );
});

afterAll(() => {
  fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
});

describe("getAllPosts", () => {
  it("returns published posts sorted by date descending", () => {
    const { getAllPosts } = require("@/lib/mdx").__setupWithDirs(
      path.join(FIXTURES_DIR, "blog"),
      path.join(FIXTURES_DIR, "projects")
    );
    const posts = getAllPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe("hello-world");
    expect(posts[0].title).toBe("Hello World");
    expect(posts[0].tags).toEqual(["nextjs", "typescript"]);
  });

  it("excludes draft posts", () => {
    const { getAllPosts } = require("@/lib/mdx").__setupWithDirs(
      path.join(FIXTURES_DIR, "blog"),
      path.join(FIXTURES_DIR, "projects")
    );
    const posts = getAllPosts();
    expect(posts.find((p: { slug: string }) => p.slug === "draft-post")).toBeUndefined();
  });
});

describe("getPostBySlug", () => {
  it("returns post with content for a valid slug", () => {
    const { getPostBySlug } = require("@/lib/mdx").__setupWithDirs(
      path.join(FIXTURES_DIR, "blog"),
      path.join(FIXTURES_DIR, "projects")
    );
    const post = getPostBySlug("hello-world");
    expect(post).not.toBeNull();
    expect(post!.title).toBe("Hello World");
    expect(post!.content).toContain("Content here");
  });

  it("returns null for unknown slug", () => {
    const { getPostBySlug } = require("@/lib/mdx").__setupWithDirs(
      path.join(FIXTURES_DIR, "blog"),
      path.join(FIXTURES_DIR, "projects")
    );
    expect(getPostBySlug("does-not-exist")).toBeNull();
  });
});

describe("getAllProjects", () => {
  it("returns projects sorted by order", () => {
    const { getAllProjects } = require("@/lib/mdx").__setupWithDirs(
      path.join(FIXTURES_DIR, "blog"),
      path.join(FIXTURES_DIR, "projects")
    );
    const projects = getAllProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].title).toBe("My Project");
    expect(projects[0].featured).toBe(true);
  });
});

describe("getProjectBySlug", () => {
  it("returns project with content for a valid slug", () => {
    const { getProjectBySlug } = require("@/lib/mdx").__setupWithDirs(
      path.join(FIXTURES_DIR, "blog"),
      path.join(FIXTURES_DIR, "projects")
    );
    const project = getProjectBySlug("my-project");
    expect(project).not.toBeNull();
    expect(project!.tech).toEqual(["nextjs", "tailwind"]);
    expect(project!.content).toContain("Project details");
  });

  it("returns null for unknown slug", () => {
    const { getProjectBySlug } = require("@/lib/mdx").__setupWithDirs(
      path.join(FIXTURES_DIR, "blog"),
      path.join(FIXTURES_DIR, "projects")
    );
    expect(getProjectBySlug("does-not-exist")).toBeNull();
  });
});
