import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.email || typeof body.email !== "string") {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.warn("[newsletter] Supabase env vars not set — subscription not saved");
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("subscribers")
    .upsert({ email, is_active: true }, { onConflict: "email" });

  if (error) {
    console.error("[newsletter] Supabase error:", error);
    return NextResponse.json({ error: "No se pudo suscribir" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
