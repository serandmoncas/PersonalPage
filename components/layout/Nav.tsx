"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-6">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-sm transition-colors hover:text-[hsl(var(--accent))] ${
            pathname === href
              ? "font-semibold text-[hsl(var(--accent))]"
              : "text-[hsl(var(--muted-foreground))]"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
