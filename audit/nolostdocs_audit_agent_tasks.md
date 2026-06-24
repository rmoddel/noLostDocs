# NoLostDocs Website Audit — Agent Task Spec
URL: https://nolostdocs.rmoddel.com/  
Date: 2026-06-24
## Verdict
The concept, logo direction, and color palette are usable, but the site must shift from decorative document brand to trusted utility for sensitive documents.
## Primary Problem
The website does not clearly communicate trust, utility, security, and product specificity above the fold. The page also appears to expose little or no meaningful server-rendered/crawlable HTML content.
## Top Priority
Make the homepage crawlable, specific, trust-building, and conversion-oriented.
## Brand Tokens
```css
:root {
  --primary: #231d1b;
  --accent: #a95d4d;
  --background: #f7f1ea;
  --surface: #ffffff;
  --soft-accent: rgba(169, 93, 77, 0.12);
  --border: rgba(35, 29, 27, 0.12);
  --muted: rgba(35, 29, 27, 0.66);
  --success: #3f7f68;
}
```
## Required Homepage Copy
- **headline**: No more lost docs.
- **subheadline**: Securely store, organize, and find your important documents — license, insurance, registration, medical cards, and more — all in one place.
- **primary_cta**: Get Started
- **secondary_cta**: See how it works
- **disclaimer**: NoLostDocs helps you keep secure copies organized. Acceptance of digital copies depends on the situation, provider, agency, or law.
- **security_heading**: Built for documents you don’t want floating around.
- **lost_phone_heading**: Lost your phone?
- **lost_phone_copy**: Lock your account from the web portal and protect your documents.

## Priority Tasks
### P0-001 — Expose crawlable homepage content
- Priority: `P0`
- Type: `seo/ssr`

**Problem**

The live site appears to expose little/no meaningful HTML content to non-browser fetchers.

**Implementation**

- Ensure homepage is server-rendered or statically rendered in Next.js.
- Render h1, subheadline, category cards, security section, and CTA in initial HTML.
- Do not rely on client-only rendering for core marketing text.

**Acceptance Criteria**

- [ ] curl -L https://nolostdocs.rmoddel.com/ returns visible text including 'No more lost docs.'
- [ ] View-source contains h1 and meta tags.
- [ ] No blank page for crawler-like user agents.

### P0-002 — Implement metadata and social unfurl
- Priority: `P0`
- Type: `seo/unfurl`

**Implementation**

- Add Next.js metadata export for title, description, canonical, openGraph, twitter.
- Add /og-image.png or dynamic OG route.
- Add site.webmanifest, robots.txt, sitemap.xml.

**Acceptance Criteria**

- [ ] Page title is 'NoLostDocs | No more lost docs. Everything you need in one app.'
- [ ] Meta description exists and is under 160 chars.
- [ ] og:title, og:description, og:image, twitter:card, twitter:image exist.
- [ ] Unfurl works in WhatsApp/Slack/iMessage/LinkedIn-style previews.

### P0-003 — Fix above-the-fold clarity
- Priority: `P0`
- Type: `ux/copy`

**Implementation**

- Hero headline: 'No more lost docs.'
- Subheadline clearly explains secure document storage and examples.
- Primary CTA: 'Get Started'. Secondary CTA: 'See how it works'.
- Show visual product/dashboard mockup or document category cards.

**Acceptance Criteria**

- [ ] Within 5 seconds, user understands what the app does.
- [ ] Hero mentions concrete document examples.
- [ ] CTA is visible without scrolling on desktop and mobile.

### P0-004 — Add clear trust/security section
- Priority: `P0`
- Type: `trust/security-copy`

**Implementation**

- Add section: 'Built for documents you don’t want floating around.'
- Use specific claims only if implemented: private storage, secure login, cloud backup controls, remote account lock.
- Avoid overclaims like 'military-grade' or 'bank-level' unless substantiated.

**Acceptance Criteria**

- [ ] Security section appears on homepage.
- [ ] No legally risky or technically unverified claims.
- [ ] Users understand the difference between storage and legal document replacement.

### P1-001 — Add document category cards
- Priority: `P1`
- Type: `ux/content`

**Implementation**

- Add cards for Personal, Driving, Medical, Business.
- Each card lists 2-4 example document types.
- Use consistent icon style matching the logo.

**Acceptance Criteria**

- [ ] Cards are visible on homepage and/or dashboard.
- [ ] Cards are tappable/clickable if part of app portal.
- [ ] Examples include license, registration, insurance, medical cards.

### P1-002 — Add lost-phone story section
- Priority: `P1`
- Type: `ux/trust`

**Implementation**

- Add a homepage section explaining remote account lock.
- Do not imply recovery is possible for local-only data unless cloud backup is enabled.
- Link to security or account settings page if available.

**Acceptance Criteria**

- [ ] Section clearly says account can be locked from web portal.
- [ ] Copy distinguishes local-only vs cloud backup behavior.

### P1-003 — Simplify logo usage in navbar
- Priority: `P1`
- Type: `visual-design`

**Implementation**

- Use small icon mark + NoLostDocs wordmark in navbar.
- Do not use full tagline in navbar.
- Use 'Lost' in accent color #a95d4d; rest #231d1b.

**Acceptance Criteria**

- [ ] Navbar logo remains readable at mobile sizes.
- [ ] Icon is not visually muddy at 32px height.
- [ ] Brown accent is controlled and not overused.

## Recommended Routes / Information Architecture
- `/` — Public landing page
- `/login` — Authentication
- `/signup` — Account creation
- `/dashboard` — Portal home with categories and recent docs
- `/documents` — All documents/search
- `/documents/[id]` — Secure document viewer/details
- `/categories/[slug]` — Category document list
- `/security` — Public security/trust page
- `/privacy` — Privacy policy
- `/settings/devices` — Device management and remote lock
- `/settings/billing` — Subscription/billing

## Homepage Section Order
- Header/navbar
- Hero with headline, subheadline, CTAs, product visual
- Document category cards
- How it works: upload/organize/find
- Security/trust section
- Lost-phone/remote-lock section
- Legal/acceptance disclaimer
- Final CTA
- Footer with privacy/security links

## Functionality Tests
### Authentication
- [ ] User can sign up with email and password.
- [ ] User cannot access /dashboard while logged out.
- [ ] User is redirected to dashboard after login.
- [ ] Invalid login shows non-leaky error message.
- [ ] Password reset flow sends email and accepts valid reset token.
- [ ] Session persists across refresh but respects logout.

### Document upload
- [ ] User can upload image/PDF document.
- [ ] User can assign category and document type.
- [ ] Upload rejects unsupported file types.
- [ ] Upload rejects files above configured limit.
- [ ] Upload failure shows clear retry message.
- [ ] Uploaded document appears in category and recent docs.

### Document viewing
- [ ] User can open own document.
- [ ] User cannot open another user's document by guessing ID.
- [ ] Viewer handles image, PDF, and unknown file gracefully.
- [ ] Download/share buttons obey permissions and subscription tier.
- [ ] Document metadata can be edited by owner only.

### Search and organization
- [ ] Search finds documents by title/type/category.
- [ ] Empty search state is useful.
- [ ] Category filters work.
- [ ] Recent docs sorts newest first.
- [ ] Deleted/archived docs do not appear in normal lists.

### Remote lock
- [ ] User can lock account/device from settings.
- [ ] Locked device/session cannot access documents.
- [ ] Remote lock revokes active sessions or blocks access on next request.
- [ ] Unlock/re-authorize path is explicit and secure.
- [ ] User receives lock confirmation notification/email if implemented.

### Local-only vs cloud
- [ ] UI clearly marks when cloud backup is off.
- [ ] UI clearly marks when cloud backup is on.
- [ ] Web portal does not falsely show local-only mobile docs as cloud backed up.
- [ ] Deleting cloud backup does not imply local deletion unless intended.
- [ ] Upgrade flow explains what changes when enabling cloud backup.

## Audit Tests
### SEO
- [ ] curl homepage and assert core copy exists in HTML.
- [ ] Validate title, description, canonical.
- [ ] Validate Open Graph and Twitter tags.
- [ ] Validate robots.txt returns 200.
- [ ] Validate sitemap.xml returns 200 and includes homepage/security/privacy.
- [ ] Run Lighthouse SEO score target >= 95.

### ACCESSIBILITY
- [ ] Exactly one h1 on homepage.
- [ ] All images have meaningful alt text or empty alt when decorative.
- [ ] Buttons/links have accessible names.
- [ ] Keyboard navigation works through nav, CTAs, upload controls, dashboard cards.
- [ ] Focus states are visible.
- [ ] Contrast ratio passes WCAG AA for text and CTAs.
- [ ] Run axe checks with zero serious/critical issues.

### PERFORMANCE
- [ ] Lighthouse Performance target >= 90 on desktop and >= 80 mobile initially.
- [ ] Hero image optimized with next/image or static optimized asset.
- [ ] No huge unused JS bundles for public landing page.
- [ ] Fonts are optimized and do not block rendering unnecessarily.
- [ ] Largest Contentful Paint target < 2.5s.

### SECURITY
- [ ] No service-role or secret keys in client bundle.
- [ ] Supabase RLS enabled on all user data tables.
- [ ] Private storage buckets for user documents.
- [ ] Signed URLs expire quickly.
- [ ] All document access checks server-side or via enforced RLS.
- [ ] Security headers configured: CSP, frame-ancestors, Referrer-Policy, X-Content-Type-Options.
- [ ] No sensitive document metadata leaks in public HTML or client logs.
- [ ] Audit logs record sensitive actions if implemented.

### RESPONSIVE
- [ ] Homepage works at 360px width.
- [ ] Navbar does not overflow mobile width.
- [ ] Hero CTA remains visible on mobile.
- [ ] Category cards stack cleanly on mobile.
- [ ] Dashboard card grid usable on mobile and tablet.

## Suggested Files / Components
- `app/page.tsx`
- `app/layout.tsx`
- `app/security/page.tsx`
- `app/privacy/page.tsx`
- `app/dashboard/page.tsx`
- `app/documents/page.tsx`
- `app/settings/devices/page.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `public/og-image.png`
- `public/site.webmanifest`
- `components/marketing/Hero.tsx`
- `components/marketing/CategoryCards.tsx`
- `components/marketing/SecuritySection.tsx`
- `components/marketing/LostPhoneSection.tsx`
- `components/marketing/Disclaimer.tsx`
- `components/layout/Navbar.tsx`
- `components/layout/Footer.tsx`
- `components/dashboard/DocumentCategoryCard.tsx`
- `components/dashboard/RecentDocuments.tsx`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/security/headers.ts`

## Next.js Metadata Starter

```tsx
export const metadata = {
  title: "NoLostDocs | No more lost docs. Everything you need in one app.",
  description:
    "Securely store, organize, and access your important documents from one place. No more lost docs.",
  metadataBase: new URL("https://nolostdocs.rmoddel.com"),
  alternates: {
    canonical: "/",
  },
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
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NoLostDocs",
    description: "No more lost docs. Everything you need in one app.",
    images: ["/og-image.png"],
  },
};
```

## Machine Instruction Summary

1. Do not redesign randomly.
2. Preserve the warm brown palette, but use the accent sparingly.
3. Make the homepage server-rendered/crawlable.
4. Make the site feel like a trusted utility, not a decorative document brand.
5. Do not overclaim legal acceptance or security.
6. Build and test the portal around clear document organization, secure storage, and lost-phone protection.
