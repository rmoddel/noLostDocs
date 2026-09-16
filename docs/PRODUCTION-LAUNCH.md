# NoLostDocs production launch review

Reviewed September 15, 2026. This is a source-code readiness review with local build, unit, dependency, and HTTP checks. Production configuration and deployed behavior have not been certified. No production changes were made.

## Launch decision

**Do not invite users to rely on this as their only document vault yet.** Browser capture, encrypted cloud upload, organization, and same-browser retrieval exist. The following are product/security work, not settings that an operator can switch on:

- **Cross-device encryption-key recovery:** wrapping keys are non-extractable keys in the original browser’s IndexedDB. Clearing browser data or losing the device can permanently prevent decryption. Account password reset does not recover these keys. A reviewed recovery design, migration of existing files, and restore tests are required before promising recovery.
- **Paid self-service:** subscription webhook processing exists; checkout, billing portal, and robust reconciliation of duplicate/out-of-order events are not a completed purchase flow. Keep paid launch disabled until these are implemented and tested.
- **Commercial scan/OCR:** no Scanbot SDK or ABBYY processing integration is connected. Adding credentials does not enable either. Browser camera/upload and optional local image enhancement work without these vendors. Cloud OCR would also require an explicit privacy and encryption design.
- **Abuse and storage lifecycle:** public contact submissions and signed-upload issuance need production-grade rate limits. Document count limits do not bound abandoned storage uploads. Define orphan cleanup and storage quotas before opening unrestricted signup.
- **Security validation:** execute the existing pgTAP suite, adversarial two-account isolation tests, device-lock tests, and real auth/storage flows in staging. Database tests could not run against an unavailable local database.

## Implemented in this pass

- Correct Next.js 15 middleware entry point; session refresh now appears in build output.
- Frame blocking, MIME sniffing protection, referrer privacy, camera-only permissions, production HSTS, and a limited CSP protecting framing, forms, objects, and base URLs. This is **not** a nonce-based script CSP.
- Recent-auth checks use authentication events, not token refresh timestamps. New browser registration needs recent authentication; refreshing a registered browser no longer restores revoked trust.
- Signed uploads require the encrypted-file MIME/name convention and use opaque object names rather than document titles. This check does not cryptographically prove arbitrary clients encrypted their payloads.
- Patched PostCSS via a pinned override and lockfile.
- Original-preserving scan saves; optional crop/enhancement with preview and restore; size/empty-file checks; bounded image-processing dimensions; duplicate-save guard; handled quality failures; accurate PDF metadata.
- Native nested dialogs, focus handling, Escape behavior, reduced motion, keyboard focus indicators, skip link, loading/error UI, corrected manifest reference, and honest empty/security states.
- Expired/review/archived records remain eligible for backend-authorized retrieval. Record lifecycle is no longer confused with authentication state.
- Explicit browser-key recovery warning before upload and on security/privacy pages. Provider labels no longer infer implementation from environment variables.

## Manual configuration checklist

| Order | Where | Required configuration | Verify before opening access |
|---|---|---|---|
| 1 | Hosting / DNS | Confirm canonical production hostname, DNS records, managed TLS certificate, HTTPS redirects, repository/branch, and monorepo root `apps`. Use root `amplify.yml` (`npm ci`, workspace build, output `apps/.next`). Keep a known-good rollback build. | Certificate is valid; root redirects through login; no development domain in canonical URLs. Metadata and static sitemap currently use `https://nolostdocs.rmoddel.com`; changing domains also requires updating those sources. |
| 2 | Hosting build environment | Set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the intended project. Public values are compiled into browser bundles: rebuild after changing them. | No placeholders; intended project is reached; no service-role, payment, or OCR secret appears in browser assets. |
| 3 | Supabase database | Confirm project linkage and compare local/remote migration histories. Apply all repository migrations through `20260908033028_security_overhaul_priority_list.sql` to staging, then production after successful tests. Do not repair migration history blindly. | Categories/types/default owner profiles exist; RLS and column grants match the migrations; pgTAP and two-account access-denial tests pass; Security Advisor reviewed. |
| 4 | Supabase Storage | `user-documents` must be private. Confirm direct authenticated storage policies were removed by hardening. Set allowed MIME to `application/octet-stream` and a server-side file-size cap of **10 MiB + 16 bytes** for AES-GCM overhead (10,485,776 bytes). If the dashboard only permits whole MiB, use 11 MiB and retain the 10 MiB client limit. | Anonymous/direct client listing, upload, and download are denied; authorized encrypted upload and 60-second signed retrieval work. Inventory any legacy plaintext objects and migrate/remove them through an approved data process. |
| 5 | Edge Functions | Deploy `register-device`, `lock-device`, `unlock-device`, `create-signed-upload`, `create-signed-download`, `cleanup-uploaded-file`, `audit-log`, and `contact-submit`. Deploy `stripe-webhook` only with billing configuration. Keep service-role credentials server-side (`SERVICE_ROLE_KEY`, or platform-provided `SUPABASE_SERVICE_ROLE_KEY`). Supabase provides `SUPABASE_URL`. | New device registration, lock, denied access, recent reauth, unlock, upload cleanup, and audit writes work. Function deployment alone does not apply migrations. |
| 6 | Edge gateway authentication | Public `contact-submit` and Stripe’s webhook must be deployed with gateway JWT verification disabled; Stripe uses its own signature check. Authenticated file/device/audit functions must retain their own `requireUser` checks regardless of gateway settings. | Anonymous contact works; missing/invalid user bearer tokens fail on protected endpoints; forged Stripe signatures fail. Restrict abuse before exposing public contact. |
| 7 | Supabase Auth / Google | Set exact production Site URL and callback allowlist (`/auth/callback`, `/auth/confirm` as used by email templates). Remove wildcard preview domains from the production project. Configure Google client ID/secret, authorized origins and Supabase OAuth callback if offering Google login. | Test signup, confirmation, password sign-in, Google sign-in, logout, callback failure, and token refresh on the actual domain. Establish and test a password-recovery flow; no dedicated reset screen currently exists. |
| 8 | Auth email / controls | Configure custom SMTP, verified sender domain and SPF/DKIM/DMARC. Disable email link tracking. Enable email confirmation, appropriate password policy/leaked-password protection, auth rate limits, and OTP lifetime. CAPTCHA requires matching frontend token integration before enabling it. | Confirmation email arrives outside the operator’s account; redirects are safe; invalid/expired links have useful errors; password policy enforced by server. |
| 9 | Operator access | Require MFA for hosting, Supabase, source control, billing, and email administrators. Set least-privilege membership, credential rotation ownership, database SSL enforcement and appropriate network restrictions. | No shared admin credentials; backup owner available; access reviewed. |
| 10 | Backups / operations | Choose production service tier and database backup/PITR retention. Back up Storage objects separately, with encryption and a tested restore process. Database backups alone do not recover object bytes or browser encryption keys. Configure uptime/error alerts, storage/billing thresholds, audit retention, and incident ownership without logging document contents or signed URLs. | Restore drill succeeds; alert reaches its owner; storage growth and failed auth/upload rates are visible. |
| 11 | Contact support | Assign an operator to review `contact_requests` or implement a notification worker. The current function records a request; it does not send email notifications. Configure rate limiting/bot protection that covers the Edge endpoint itself. | A synthetic request is visible and triaged; oversized submissions are rejected; abuse controls tested. |
| 12 | Stripe — optional, blocked on purchase work | Create products/prices, configure subscription events (`customer.subscription.created`, `.updated`, `.deleted`), set `STRIPE_WEBHOOK_SECRET`, and arrange trusted `metadata.user_id` / `metadata.plan`. Keep test and live mode separate. | Invalid signatures fail; repeat/out-of-order/cancel/payment-failure events cannot leave incorrect entitlements; checkout and customer portal tested before billing users. |
| 13 | Policy / launch operations | Finalize retention/deletion and support processes, privacy/terms/contact details, and vendor review for the data you intend to accept. Keep no-HIPAA/no-legal-equivalence claims accurate. | Claims match deployed capabilities; users understand browser-key limitations; deletion and support requests have an owner. |

Commercial Scanbot and ABBYY credentials are **not required** for the browser scanner. Do not add them to launch configuration until the respective integrations exist.

## Release validation

Automated commands:

```sh
npm run test:security-scan
npm run typecheck
npm run build:web
npm audit --omit=dev
supabase test db --local
```

The focused test runner uses Node 22+ TypeScript stripping. Deno typechecking passed for changed protected Edge Functions, but the installed Deno test runtime crashed; the shared session tests were run successfully using Node instead.

Staging/browser checks still required: narrow/mobile viewport, Safari/iOS and Android camera permissions, denied camera fallback, nested-dialog focus/Tab/Escape restoration, image crop/restore and rotation, HEIC fallback, empty/oversized/corrupt files, PDF download, double-click save, network failure during upload, successful save followed by refresh failure, same-browser decryption, missing-key error on another browser, sign-out preview disposal, locked-device denial, and account A attempting account B’s files.

A browser was not connected for this session, so this is not a completed visual or end-to-end certification. Local HTTP verified an unauthenticated `/dashboard` redirect to `/login?next=%2Fdashboard` and security headers. No production deployment, live environment-secret inventory, or live database-policy inspection was performed.

## Official references

- [Next.js 15 middleware](https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware)
- [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase JWT claims](https://supabase.com/docs/guides/auth/jwts)
- [PostCSS releases](https://github.com/postcss/postcss/releases)
