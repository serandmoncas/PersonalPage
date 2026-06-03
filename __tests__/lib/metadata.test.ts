import { generatePageMetadata } from "@/lib/metadata";

describe("generatePageMetadata", () => {
  it("builds metadata with title and description", () => {
    const meta = generatePageMetadata({
      title: "Blog",
      description: "My posts",
    });
    expect(meta.title).toBe("Blog | Tu Nombre");
    expect(meta.description).toBe("My posts");
  });

  it("includes OpenGraph fields", () => {
    const meta = generatePageMetadata({ title: "Home", description: "Personal site" });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.title).toBe("Home | Tu Nombre");
    expect(typeof og.url).toBe("string");
  });

  it("uses site name as fallback title when no title given", () => {
    const meta = generatePageMetadata({ description: "Personal page" });
    expect(meta.title).toBe("Tu Nombre");
  });

  it("includes Twitter card metadata", () => {
    const meta = generatePageMetadata({ title: "About", description: "About me" });
    expect(meta.twitter).toBeDefined();
    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.card).toBe("summary_large_image");
  });
});
