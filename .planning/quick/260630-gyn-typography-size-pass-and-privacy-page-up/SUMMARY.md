---
status: complete
completed: 2026-06-30
---

Applied the institutional typography size pass and replaced the placeholder privacy route with generic release-usable policy copy that still reflects the current NoLostDocs web product and a possible future browser extension surface.

Delivered:
- reduced the global `h1` and `h2` scale in `apps/styles/globals.css` to tighten the overall visual tone without shrinking body copy
- expanded `apps/app/privacy/page.tsx` into a full public privacy page covering scope, handled information, scan/camera behavior, retention direction, third-party services, and extension-safe language
- confirmed `/privacy` already inherits the shared `SiteHeader` and `SiteFooter` via `apps/app/layout.tsx`

Verification:
- `npm run build -w @nolostdocs/web`
- inspected compiled `apps/.next/server/app/privacy.rsc` output to confirm `/privacy` renders inside the shared `site-shell` with header and footer
