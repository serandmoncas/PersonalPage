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
