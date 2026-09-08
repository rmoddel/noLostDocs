# Security Overhaul Priority List Plan

## What And Why

Implement the security and product-honesty priorities from the September 2026 review. The app stores sensitive identity, medical, vehicle, and business records, so protected file handling must move from prototype claims to enforceable controls.

## Success Criteria

- Signed uploads and downloads require an authenticated, trusted, unlocked browser device.
- Premium access is resolved from backend-owned subscription rows, not user-editable profile fields.
- Stripe webhook payloads are signature verified before subscription state changes.
- Sensitive file actions produce durable audit events.
- Upload metadata stops implying encryption that is not implemented.
- Redirect helpers reject protocol-relative paths.
- Dashboard copy and file labels reflect actual implementation.
- RLS/grant hardening and regression tests are added for the known risks.
- Project documentation records remaining launch blockers honestly.

## Files To Edit

- `apps/lib/auth/getAuthRedirectUrl.ts`
- `apps/app/auth/callback/route.ts`
- `apps/app/auth/confirm/route.ts`
- `apps/app/login/page.tsx`
- `apps/lib/devices/actions.ts`
- `apps/lib/documents/download.ts`
- `apps/lib/documents/upload.ts`
- `apps/components/dashboard/DashboardShell.tsx`
- `supabase/functions/_shared/plans.ts`
- `supabase/functions/_shared/supabase.ts`
- `supabase/functions/_shared/*`
- `supabase/functions/audit-log/index.ts`
- `supabase/functions/create-signed-upload/index.ts`
- `supabase/functions/create-signed-download/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/migrations/*`
- `supabase/tests/*`
- `.planning/*`

## Risks

- Full client-side encryption requires a durable key recovery design; this pass will block false encryption claims and mark files as plaintext unless encryption is actually added safely.
- Live Supabase verification depends on a configured local or remote Supabase project.
- Stripe signature verification depends on `STRIPE_WEBHOOK_SECRET` being configured in deployment.

## Verification

- `npm run typecheck`
- `npm run build:web`
- `npm audit --omit=dev`
- `supabase test db` if the Supabase CLI and test database are available
- Manual review of auth redirect, signed upload/download, and audit flows
