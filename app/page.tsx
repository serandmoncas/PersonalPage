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
