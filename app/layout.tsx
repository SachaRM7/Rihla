import type { Metadata, Viewport } from "next";
import "./globals.css";

const themeBootstrap = `try{const value=JSON.parse(localStorage.getItem("rihla.library.v1")||"{}");if(["olive","rose","orange","violet"].includes(value.theme))document.documentElement.dataset.theme=value.theme;const appearance=value.appearance==="light"?"light":value.appearance==="dark"?"dark":matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.appearance=appearance;if(["compact","comfortable","large"].includes(value.readingSize))document.documentElement.dataset.readingSize=value.readingSize}catch{}`;

export const metadata: Metadata = {
  title: "RIHLA — Coran audio et texte synchronisé",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "RIHLA", statusBarStyle: "black-translucent" },
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
