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
