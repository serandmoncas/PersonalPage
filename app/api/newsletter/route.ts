import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.email || typeof body.email !== "string") {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email }),
    });
  } catch {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error" }));
    return NextResponse.json(
      { error: (error as { detail?: string }).detail ?? "Error al suscribir" },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
