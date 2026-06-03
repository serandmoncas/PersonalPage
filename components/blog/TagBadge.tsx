import Link from "next/link";

interface TagBadgeProps {
  tag: string;
  href?: string;
}

export function TagBadge({ tag, href }: TagBadgeProps) {
  const className =
    "rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]/10 hover:text-[hsl(var(--accent))] transition-colors";

  if (href) return <Link href={href} className={className}>{tag}</Link>;
  return <span className={className}>{tag}</span>;
}
