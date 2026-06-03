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
