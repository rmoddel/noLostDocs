---
phase: 06
plan: 01
subsystem: swap-archive
tags:
  - cutover
  - nextjs
  - archive
  - workspace
metrics:
  build_verified: true
  typecheck_verified: true
---

# Summary 06-01

## Outcome

Completed the Phase 6 cutover. The verified Next.js app now lives in `apps/web`, and the Vite prototype is preserved as `apps/web-vite-reference`.

## Verified

- `npm --workspace apps/web run typecheck` passed
- `npm run build:web` passed
- protected dashboard and scan routes now redirect server-side to `/login`
- `sitemap.xml` no longer publishes `/dashboard` or `/scan`
- the live app package name is `@doc-wallet/web`
- the archived prototype package name is `@doc-wallet/web-vite-reference`

## Self-Check

PASSED
