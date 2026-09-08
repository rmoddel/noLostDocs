# Codebase Testing

## Current Verification

- Root workspace typecheck: `npm run typecheck`
- Web production build: `npm run build:web`
- Dependency audit: `npm audit --omit=dev`
- Edge Function typecheck: `deno check supabase/functions/...`
- Supabase pgTAP tests: `supabase test db --local`

## Current Status

- Web TypeScript checks pass.
- Next.js production build passes on Next 16.
- npm audit reports zero vulnerabilities after the Next upgrade.
- Edge Functions typecheck under Deno with pinned Supabase npm imports.
- `supabase/tests/security_overhaul_rls_test.sql` covers the new RLS/grant/encryption-policy assumptions.
- pgTAP tests could not be executed in the current environment because Docker Desktop is not running, so local Supabase Postgres is unavailable on `127.0.0.1:54322`.

## Remaining Gaps

- No React unit/component tests yet.
- No Playwright end-to-end tests yet.
- No Edge Function behavior tests with a seeded local Supabase project yet.
- No browser crypto recovery tests across multiple devices.
- No Stripe webhook fixture tests.

## Recommended Near-Term Additions

- Start Docker Desktop and run `supabase start`, then `supabase test db --local`.
- Add Playwright smoke tests for `/`, `/login`, `/dashboard`, scan upload, and signed download denial states.
- Add function-level tests for locked-device denial, stale-session denial, webhook signature rejection, and valid subscription sync.
- Add a manual encrypted upload/download validation script using a real Supabase project.
