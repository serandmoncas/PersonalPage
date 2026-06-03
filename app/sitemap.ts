import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/mdx";
import { site } from "@/lib/site.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const staticPages = ["/", "/about", "/blog", "/projects", "/contact"].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  return [...staticPages, ...posts];
}
