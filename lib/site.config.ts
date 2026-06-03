export const site = {
  name: "Tu Nombre",
  bio: "Developer · Builder · Lifelong learner",
  url: "https://tunombre.com",
  github: "tu-usuario",
  twitter: "tu-handle",
  linkedin: "tu-perfil",
  email: "tu@email.com",
  skills: ["TypeScript", "React", "Next.js", "Python", "PostgreSQL"],
} as const;

export type SiteConfig = typeof site;
