import type { Metadata, Viewport } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://theartwalk.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "The Art Walk · Delhi's exhibitions on a map", template: "%s · The Art Walk" },
  description: "Find exhibitions open near you in Delhi, follow curated gallery walks and see this week's opening nights.",
  applicationName: "The Art Walk",
  openGraph: { siteName: "The Art Walk", type: "website", locale: "en_IN" },
  appleWebApp: { capable: true, title: "The Art Walk", statusBarStyle: "default" }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F2EF" },
    { media: "(prefers-color-scheme: dark)", color: "#141413" }
  ]
};

// Applies the saved theme and language before first paint, so there is no flash.
const boot = `try{var t=JSON.parse(localStorage.getItem("taw-theme")||'"system"');if(t!=="system")document.documentElement.dataset.theme=t;var l=JSON.parse(localStorage.getItem("taw-lang")||'"en"');document.documentElement.lang=l}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Devanagari:wght@400;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
