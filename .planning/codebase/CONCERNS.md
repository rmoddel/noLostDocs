# Codebase Concerns

## High Priority

- Encrypted file recovery is local-device only. Users who lose browser storage cannot decrypt prior uploads until a recovery-key or multi-device key-sharing design is implemented.
- Device trust is stronger than before but still client-declared. Add MFA/step-up auth and session-aware device authorization before public launch.
- The new migration and pgTAP tests still need to run against a real local or remote Supabase project.
- Stripe webhook verification now requires `STRIPE_WEBHOOK_SECRET`; production subscription sync will fail until that secret is configured.

## Medium Priority

- Scanbot and ABBYY selections are still not live production integrations.
- Contact form abuse controls are still missing.
- `packages/config` retains prototype snapshot fallbacks and should be removed from protected app flows before launch.
- Legacy plaintext rows are marked `plaintext-v1`; decide whether to migrate/re-encrypt them or block retrieval until re-upload.

## Low Priority

- Public marketing components remain in the repo but `/` now redirects to the working app.
- Planning artifacts still include archived phase history that may mention old Vite paths.
- There is no local lint implementation beyond the root workspace passthrough.

## Open Alignment Questions

- Choose whether `NoLostDocs` remains the brand name after trademark/domain review.
- Define the recovery-key UX before inviting real users to store irreplaceable documents.
- Decide which workflows deserve first-class dashboard routes next: sharing packets, expiration reminders, trusted contacts, or document-type management.
