# Codebase Integrations

## Supabase

- Web reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Server/Edge code uses `SUPABASE_URL` and `SERVICE_ROLE_KEY`.
- Migrations define profiles, devices, document metadata, document files, shares, subscriptions, audit events, RLS, grants, storage bucket intent, and hardening triggers.
- Sensitive Storage access is intended to flow through Edge Functions and short-lived signed URLs, not direct client bucket policies.
- Local pgTAP tests live under `supabase/tests`.

## Stripe

- `supabase/functions/stripe-webhook` handles subscription lifecycle events.
- Webhook payloads must include a valid `Stripe-Signature` header.
- Deployment must set `STRIPE_WEBHOOK_SECRET`.
- Premium entitlement is resolved from active/trialing `subscriptions` rows only.

## Browser Crypto

- Uploads are encrypted client-side with Web Crypto.
- Wrapped file-key metadata is stored in `document_files.encrypted_file_key`.
- The wrapping key is local to the browser IndexedDB store.
- Cross-device recovery is still deferred.

## Scan And OCR

- Browser file/camera capture is active.
- Image quality analysis runs before image saves and records quality metadata.
- Scanbot remains the selected guided-capture provider once licensed.
- ABBYY remains the selected OCR provider once connector credentials and processing are implemented.

## Deployment Targets

- Web deploys from `apps`.
- Root Amplify config exists in `amplify.yml`.
- Next.js now builds without Google Fonts network fetches.

## Missing or Deferred Integrations

- No committed live Supabase project link or Docker-backed local test environment is guaranteed.
- No full OCR extraction pipeline yet.
- No multi-device key recovery yet.
- No analytics, monitoring, rate limiting, or CAPTCHA/Turnstile integration yet.
