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
