import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Sora } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { assetPaths } from "@/constants/assets";
import { brand } from "@/constants/brand";
import "@/styles/globals.css";

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces"
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: brand.title,
  description: brand.description,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: brand.title,
    description: brand.description,
    url: brand.siteUrl,
    siteName: brand.name,
    images: [
      {
        url: assetPaths.unfurl.og,
        width: 1200,
        height: 630,
        alt: "NoLostDocs"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: brand.title,
    description: brand.description,
    images: [assetPaths.unfurl.twitter]
  },
  icons: {
    icon: [
      { url: assetPaths.icons.favicon },
      { url: assetPaths.icons.favicon32, sizes: "32x32", type: "image/png" },
      { url: assetPaths.icons.favicon16, sizes: "16x16", type: "image/png" }
    ],
    apple: [{ url: assetPaths.icons.appleTouch, sizes: "180x180" }]
  },
  manifest: assetPaths.seo.manifest
};

export const viewport: Viewport = {
  themeColor: "#f7e7d9",
  colorScheme: "light"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html className={`${sora.variable} ${fraunces.variable}`} lang="en">
      <body>
        <AppProviders>
          <div className="site-shell">
            <SiteHeader />
            <main className="site-main">{children}</main>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
