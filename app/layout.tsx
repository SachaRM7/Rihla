import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RIHLA — Audio, vidéo et Coran synchronisé",
  description:
    "Prototype d’une plateforme islamique unifiant le Coran, l’audio, la vidéo et les transcriptions synchronisées.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
