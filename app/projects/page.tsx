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
        {projects.length === 0 ? (
          <p className="text-[hsl(var(--muted-foreground))] col-span-2">
            Próximamente...
          </p>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))
        )}
      </div>
    </div>
  );
}
