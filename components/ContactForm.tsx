"use client";
import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        ✓ Mensaje enviado. Te respondo pronto.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          name="name"
          required
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Mensaje</label>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] resize-none"
        />
      </div>
      {status === "error" && (
        <p className="text-sm text-red-500">No se pudo enviar. Intenta de nuevo.</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-lg bg-[hsl(var(--accent))] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "sending" ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
