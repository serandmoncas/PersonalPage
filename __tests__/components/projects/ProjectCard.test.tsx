import { render, screen } from "@testing-library/react";
import { ProjectCard } from "@/components/projects/ProjectCard";

const project = {
  title: "My Project",
  description: "A cool project",
  tech: ["nextjs", "tailwind"],
  github: "https://github.com/user/project",
  featured: true,
  order: 1,
  slug: "my-project",
};

describe("ProjectCard", () => {
  it("renders title and description", () => {
    render(<ProjectCard project={project} />);
    expect(screen.getByText("My Project")).toBeInTheDocument();
    expect(screen.getByText("A cool project")).toBeInTheDocument();
  });

  it("renders tech badges and GitHub link", () => {
    render(<ProjectCard project={project} />);
    expect(screen.getByText("nextjs")).toBeInTheDocument();
    expect(screen.getByText("tailwind")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/user/project"
    );
  });
});
