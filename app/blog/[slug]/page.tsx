import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/mdx";
import { generatePageMetadata } from "@/lib/metadata";
import { PostContent } from "@/components/blog/PostContent";
import { TagBadge } from "@/components/blog/TagBadge";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return generatePageMetadata({ title: post.title, description: post.description });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="max-w-2xl">
      <header className="mb-8">
        <time className="text-sm text-[hsl(var(--muted-foreground))]">
          {new Date(post.date).toLocaleDateString("es", {
            year: "numeric", month: "long", day: "numeric",
          })}
        </time>
        <h1 className="mt-2 text-3xl font-bold">{post.title}</h1>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
          </div>
        )}
      </header>
      <PostContent source={post.content} />
    </article>
  );
}
