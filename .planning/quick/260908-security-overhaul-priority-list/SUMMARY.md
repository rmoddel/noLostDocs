# Security Overhaul Priority List Summary

## Completed

- Redirected `/` to `/dashboard` so the working app is the primary homepage experience.
- Centralized auth redirect validation and blocked protocol-relative/cross-origin redirect targets.
- Added browser-side AES-GCM encryption before Supabase Storage upload.
- Stored encryption metadata in `document_files.encrypted_file_key` and marked legacy rows as `plaintext-v1`.
- Added local-device decryption for encrypted previews/downloads.
- Added trusted-device enforcement to signed upload, signed download, and upload cleanup flows.
- Changed browser device identity from user-agent text to a persistent per-browser random id.
- Preserved locked-device state during browser registration refresh.
- Added recent-auth enforcement before signed downloads and device unlocks.
- Implemented durable audit logging and wired audit events into file/billing flows.
- Added Stripe webhook signature verification with `STRIPE_WEBHOOK_SECRET`.
- Removed user-editable profile fields from premium entitlement resolution.
- Added RLS/grant hardening, billing-field update prevention, document quota trigger, encryption-state constraint, and null-aware document type uniqueness.
- Dropped direct client Storage policies for the sensitive document bucket.
- Added pgTAP coverage for billing grants, audit grants, subscription immutability, storage policy removal, and encryption metadata consistency.
- Upgraded Next.js to `16.3.4`; dependency audit now reports zero vulnerabilities.
- Removed `next/font/google` usage so production builds do not depend on Google Fonts DNS/network access.
- Wired scan quality analysis into the image save flow.
- Replaced placeholder dashboard labels with implemented workflows and fixed file type labels.

## Verification

- `npm run typecheck` passed.
- `npm run build:web` passed.
- `npm audit --omit=dev` passed with zero vulnerabilities.
- `deno check` passed for all touched Edge Functions.

## Not Completed

- `supabase test db --local` could not run because Docker Desktop is not running and local Postgres is unavailable on `127.0.0.1:54322`.
- Cross-device encrypted-file recovery is not implemented.
- Scanbot and ABBYY are still deployment-gated integrations, not live capture/OCR processing.
- Contact form abuse protection remains deferred.
