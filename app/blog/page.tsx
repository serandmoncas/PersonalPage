import { getAllPosts } from "@/lib/mdx";
import { generatePageMetadata } from "@/lib/metadata";
import { BlogList } from "@/components/blog/BlogList";

export const metadata = generatePageMetadata({
  title: "Blog",
  description: "Artículos sobre desarrollo de software, IA, y aprendizaje continuo.",
});

export default function BlogPage() {
  const posts = getAllPosts();
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold">Blog</h1>
      <BlogList posts={posts} />
    </div>
  );
}
