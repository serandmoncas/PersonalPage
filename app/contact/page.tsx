import { generatePageMetadata } from "@/lib/metadata";
import { ContactForm } from "@/components/ContactForm";

export const metadata = generatePageMetadata({
  title: "Contact",
  description: "Escríbeme — respondo a todas las consultas.",
});

export default function ContactPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="mt-4 text-[hsl(var(--muted-foreground))]">
        ¿Tienes una pregunta o quieres trabajar juntos? Escríbeme.
      </p>
      <ContactForm />
    </div>
  );
}
