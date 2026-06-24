// app/layout.tsx or app/page.tsx

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "NoLostDocs | No more lost docs. Everything you need in one app.",
    template: "%s | NoLostDocs",
  },
  description:
    "Securely store, organize, and find your important documents — license, insurance, registration, medical cards, and more — all in one place.",
  metadataBase: new URL("https://nolostdocs.rmoddel.com"),
  alternates: { canonical: "/" },
  applicationName: "NoLostDocs",
  keywords: [
    "document storage",
    "secure document storage",
    "digital document organizer",
    "insurance card storage",
    "registration storage",
    "important documents app",
    "NoLostDocs",
  ],
  openGraph: {
    title: "NoLostDocs",
    description: "No more lost docs. Everything you need in one app.",
    url: "https://nolostdocs.rmoddel.com",
    siteName: "NoLostDocs",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NoLostDocs — No more lost docs. Everything you need in one app.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NoLostDocs",
    description: "No more lost docs. Everything you need in one app.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon.ico" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#231d1b",
  colorScheme: "light",
};
