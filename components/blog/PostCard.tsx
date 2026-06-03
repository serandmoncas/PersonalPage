import Link from "next/link";
import type { PostMeta } from "@/lib/mdx";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="group border-b border-[hsl(var(--border))] py-6 last:border-0">
      <time className="text-xs text-[hsl(var(--muted-foreground))]">
        {new Date(post.date).toLocaleDateString("es", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
      <h2 className="mt-1 text-lg font-semibold group-hover:text-[hsl(var(--accent))] transition-colors">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{post.description}</p>
    </article>
  );
}
