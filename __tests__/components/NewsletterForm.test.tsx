import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterForm } from "@/components/NewsletterForm";

global.fetch = jest.fn();

describe("NewsletterForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders email input and submit button", () => {
    render(<NewsletterForm />);
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /suscribir/i })).toBeInTheDocument();
  });

  it("shows success message after successful submission", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<NewsletterForm />);
    await userEvent.type(screen.getByRole("textbox"), "user@example.com");
    await userEvent.click(screen.getByRole("button", { name: /suscribir/i }));

    expect(await screen.findByText(/suscrito/i)).toBeInTheDocument();
  });

  it("shows error message on API failure", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al suscribir" }),
    });

    render(<NewsletterForm />);
    await userEvent.type(screen.getByRole("textbox"), "user@example.com");
    await userEvent.click(screen.getByRole("button", { name: /suscribir/i }));

    expect(await screen.findByText(/error al suscribir/i)).toBeInTheDocument();
  });
});
