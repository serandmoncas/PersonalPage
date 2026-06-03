"use client";
import { useState, useMemo } from "react";
import { PostCard } from "@/components/blog/PostCard";
import type { PostMeta } from "@/lib/mdx";

export function BlogList({ posts }: { posts: PostMeta[] }) {
  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((p) => p.tags))).sort(),
    [posts]
  );
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const filtered = activeTag ? posts.filter((p) => p.tags.includes(activeTag)) : posts;

  return (
    <>
      {allTags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !activeTag
                ? "bg-[hsl(var(--accent))] text-white"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]/10"
            }`}
          >
            Todos
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tag === activeTag
                  ? "bg-[hsl(var(--accent))] text-white"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]/10"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      <div className="mt-8">
        {filtered.length === 0 ? (
          <p className="text-[hsl(var(--muted-foreground))]">No hay posts con ese tag.</p>
        ) : (
          filtered.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </div>
    </>
  );
}
