# Codebase Architecture

## High-Level Shape

The repository is a small TypeScript monorepo centered on one active user-facing surface: the responsive Next.js web app in `apps`. Supabase owns the cloud system of record through committed migrations and Edge Functions.

## Frontend Architecture

- `apps` is the active Next.js App Router web app.
- `/` redirects to `/dashboard`, making the working records app the primary experience.
- Unauthenticated dashboard access redirects to `/login?next=/dashboard`.
- The public header remains only on secondary information pages such as security, privacy, contact, and login.
- Dashboard data loads from Supabase tables through `apps/lib/documents/dashboard.ts`.
- Upload, preview, and download actions are client-initiated but authorized by Supabase Edge Functions.

## Protected File Flow

- Browser uploads are encrypted with Web Crypto before storage upload.
- File keys are wrapped with a local-device wrapping key stored in browser IndexedDB.
- Supabase Storage receives encrypted bytes through short-lived signed upload tokens.
- Signed download URLs are issued only after auth, recent-session, owner, and trusted-unlocked-device checks.
- Encrypted downloads are fetched by the browser and decrypted locally before preview/download.
- Cross-device recovery for encrypted files is not implemented yet and must stay explicit in product language.

## Backend Architecture

- `supabase/migrations` is the code-owned database, RLS, storage, trigger, and grant definition.
- `supabase/functions` owns privileged actions that require the service-role key.
- Billing authority comes from `subscriptions`, synchronized from verified Stripe webhooks.
- `profiles.plan` and `profiles.cloud_enabled` are legacy display/cache fields only and are no longer trusted for entitlement.
- `audit_events` is append-only from trusted server code; authenticated clients can read their own rows through RLS.

## Shared Layer

- `packages/types` defines UI/domain vocabulary.
- `packages/config` still contains prototype snapshot data for fallback/demo surfaces and should not be treated as production data.
- `packages/supabase` contains shared Supabase client/config helpers.

## Architectural Tension To Track

- Local-device encryption improves storage safety but lacks a user-friendly recovery-key and multi-device unwrap model.
- Device trust is now persistent per browser, but it is still client-declared and should later be strengthened with MFA/step-up auth and session tracking.
- Scanbot/ABBYY remain selected integrations, while live extraction still depends on commercial credentials and backend connector work.
