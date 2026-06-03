import type { Metadata } from "next";
import { site } from "./site.config";

interface PageMetaInput {
  title?: string;
  description: string;
  image?: string;
}

export function generatePageMetadata({ title, description, image }: PageMetaInput): Metadata {
  const fullTitle = title ? `${title} | ${site.name}` : site.name;
  const ogImage = image ?? `${site.url}/og.png`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(site.url),
    openGraph: {
      title: fullTitle,
      description,
      url: site.url,
      siteName: site.name,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
      ...(site.twitter ? { creator: `@${site.twitter}` } : {}),
    },
  };
}
