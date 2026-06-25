export const assetPaths = {
  logos: {
    navbar: "/logos/navbar-logo-transparent.png",
    navbarLight: "/logos/navbar-logo-light-bg.png",
    icon: "/logos/nolostdocs-icon-transparent.png"
  },
  slogan: {
    transparent: "/slogan/transparent_slogan.png"
  },
  icons: {
    favicon: "/favicon.ico",
    favicon16: "/icons/favicon-16x16.png",
    favicon32: "/icons/favicon-32x32.png",
    appleTouch: "/icons/apple-touch-icon.png",
    android192: "/icons/android-chrome-192x192.png",
    android512: "/icons/android-chrome-512x512.png",
    maskable512: "/icons/maskable-icon-512x512.png",
    msTile150: "/icons/mstile-150x150.png"
  },
  unfurl: {
    og: "/og-image.png",
    twitter: "/twitter-card.png"
  },
  seo: {
    manifest: "/manifest.webmanifest",
    browserConfig: "/browserconfig.xml",
    humans: "/humans.txt",
    security: "/.well-known/security.txt"
  }
} as const;

export const runtimeAssetManifest = {
  canonicalRuntimeRoot: "apps/web/public",
  archiveSourceRoot: "web_assets",
  notes: [
    "The Next.js runtime must only reference public URL paths served from apps/web/public.",
    "web_assets remains the archive/source package for long-term branding and SEO exports.",
    "Legacy root public and assets folders remain preserved until the final swap phase."
  ]
} as const;
