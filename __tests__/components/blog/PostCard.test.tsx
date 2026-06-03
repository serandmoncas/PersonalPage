import { render, screen } from "@testing-library/react";
import { PostCard } from "@/components/blog/PostCard";

const post = {
  title: "Hello World",
  date: "2026-01-15",
  description: "My first post",
  tags: ["nextjs"],
  draft: false,
  slug: "hello-world",
};

describe("PostCard", () => {
  it("renders post title as a link to the post", () => {
    render(<PostCard post={post} />);
    expect(screen.getByRole("link", { name: "Hello World" })).toHaveAttribute(
      "href",
      "/blog/hello-world"
    );
  });

  it("renders description and formatted date", () => {
    render(<PostCard post={post} />);
    expect(screen.getByText("My first post")).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });
});
