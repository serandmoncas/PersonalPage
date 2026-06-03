import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({ resolvedTheme: "light", setTheme: jest.fn(), theme: "light" })),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a button with aria-label", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("calls setTheme with 'dark' when current theme is light", async () => {
    const setTheme = jest.fn();
    const { useTheme } = require("next-themes");
    useTheme.mockReturnValue({ resolvedTheme: "light", setTheme, theme: "light" });

    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'light' when current theme is dark", async () => {
    const setTheme = jest.fn();
    const { useTheme } = require("next-themes");
    useTheme.mockReturnValue({ resolvedTheme: "dark", setTheme, theme: "dark" });

    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
