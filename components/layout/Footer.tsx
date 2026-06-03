import { site } from "@/lib/site.config";
import { NewsletterForm } from "@/components/NewsletterForm";

export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] py-10">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium">{site.name}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              <a
                href={`https://github.com/${site.github}`}
                className="hover:text-[hsl(var(--accent))] transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub ↗
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Newsletter
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Novedades sobre el proyecto.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
