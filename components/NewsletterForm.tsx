"use client";
import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export function NewsletterForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "Error al suscribir");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Error de conexión");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-[hsl(var(--accent))]">
        ✓ ¡Suscrito! Te avisamos cuando haya novedades.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
          aria-label="Email"
          className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-lg bg-[hsl(var(--accent))] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          {status === "sending" ? "..." : "Suscribir"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs text-red-500">{errorMsg || "Error al suscribir"}</p>
      )}
    </div>
  );
}
