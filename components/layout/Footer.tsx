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
