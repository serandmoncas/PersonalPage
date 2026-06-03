import type { NextConfig } from "next";

const config: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  experimental: { mdxRs: false },
};

export default config;
