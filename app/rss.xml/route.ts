import { Feed } from "feed";
import { getAllPosts } from "@/lib/mdx";
import { site } from "@/lib/site.config";

export async function GET() {
  const feed = new Feed({
    title: site.name,
    description: site.bio,
    id: site.url,
    link: site.url,
    language: "es",
    author: { name: site.name, email: site.email, link: site.url },
    copyright: `© ${new Date().getFullYear()} ${site.name}`,
  });

  getAllPosts().forEach((post) => {
    feed.addItem({
      title: post.title,
      id: `${site.url}/blog/${post.slug}`,
      link: `${site.url}/blog/${post.slug}`,
      description: post.description,
      date: new Date(post.date),
    });
  });

  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
