---
phase: 05
plan: 01
subsystem: parity-verification
tags:
  - verification
  - auth
  - metadata
  - assets
  - security
key-files:
  - apps/web-next/app/sitemap.ts
  - apps/web-next/components/auth/AuthGate.tsx
  - apps/web-next/app/layout.tsx
  - apps/web-next/lib/supabase/client.ts
  - apps/web-next/lib/supabase/server.ts
metrics:
  build_verified: true
  typecheck_verified: true
  route_checks_run: 8
  blocking_findings: 3
---

# Summary 05-01

## Outcome

Completed Phase 5 verification. The Next app is materially closer to launch, but it is not yet clear for Phase 6 swap.

## Verified

- `npm --workspace apps/web-next run typecheck` passed on 2026-06-24
- `npm run build:web-next` passed on 2026-06-24
- Public homepage content, contact page, login page, metadata routes, and runtime assets served correctly from `apps/web-next`
- `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `og-image.png`, and favicon assets served successfully
- Browser code uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` only
- No `service_role` exposure was found in the Next app browser boundary or shared browser-safe Supabase helper
- `apps/web` still exists as the untouched Vite fallback/reference app

## Blocking Findings

1. Protected routes are still gated only on the client.
   Unauthenticated requests to `/dashboard` and `/scan` return HTTP 200 with the "Preparing your signed-in view." shell before the client-side redirect runs. This is weaker than a server-side auth gate.

2. `sitemap.xml` currently publishes protected routes.
   `apps/web-next/app/sitemap.ts` includes `/dashboard` and `/scan`, which should not be advertised as public crawlable URLs while they remain auth-gated.

3. End-to-end live auth and Supabase-backed mutations were not verified in this workspace session.
   The local login route rendered the fallback copy `Add NEXT_PUBLIC Supabase values to activate login.`, so magic-link auth, signed upload/download, and contact submission were verified structurally and by source inspection, but not executed live against a configured environment.

## Recommendation

Do not start Phase 6 swap yet.

Complete a small remediation pass first:

- move protected route gating to a server-aware redirect or equivalent middleware/session strategy
- remove protected routes from the sitemap
- re-run Phase 5 verification with real `NEXT_PUBLIC_SUPABASE_*` values available locally or in a safe preview environment

## Self-Check

PASSED WITH BLOCKERS
