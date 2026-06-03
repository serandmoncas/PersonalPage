import { render, screen } from "@testing-library/react";
import { TagBadge } from "@/components/blog/TagBadge";

describe("TagBadge", () => {
  it("renders the tag text", () => {
    render(<TagBadge tag="nextjs" />);
    expect(screen.getByText("nextjs")).toBeInTheDocument();
  });

  it("renders as a link when href is given", () => {
    render(<TagBadge tag="nextjs" href="/blog?tag=nextjs" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/blog?tag=nextjs");
  });

  it("renders as a span when no href given", () => {
    render(<TagBadge tag="react" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
  });
});
