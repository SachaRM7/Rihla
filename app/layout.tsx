import type { Metadata, Viewport } from "next";
import "./globals.css";

const themeBootstrap = `try{const value=JSON.parse(localStorage.getItem("rihla.library.v1")||"{}").theme;if(["olive","rose","orange","violet"].includes(value))document.documentElement.dataset.theme=value}catch{}`;

export const metadata: Metadata = {
  title: "RIHLA — Coran audio et texte synchronisé",
  description:
    "Écoutez le Coran, suivez chaque ayah et retrouvez votre progression dans une interface pensée pour le mobile.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  other: {
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0c0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" translate="no" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body>{children}</body>
    </html>
  );
}
