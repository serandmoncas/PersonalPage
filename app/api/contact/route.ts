import { NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/lib/site.config";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.name || !body.email || !body.message) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  const { name, email, message } = body as { name: string; email: string; message: string };

  if (!process.env.RESEND_API_KEY) {
    // Graceful degradation — log server-side, return success to client
    console.warn("[contact] RESEND_API_KEY not set — email not sent");
    return NextResponse.json({ success: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: `contact@${new URL(site.url).hostname}`,
    to: site.email,
    replyTo: email,
    subject: `Mensaje de ${name} vía ${site.name}`,
    text: `De: ${name} <${email}>\n\n${message}`,
  });

  if (error) {
    console.error("[contact] Resend error:", error);
    return NextResponse.json({ error: "No se pudo enviar el mensaje" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
