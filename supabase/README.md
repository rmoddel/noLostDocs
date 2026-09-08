# Supabase Code Ownership

This directory is the code-authoritative home for NoLostDocs backend infrastructure.

## Goals

- Keep schema, RLS, storage policy logic, and server-side functions in git.
- Avoid production-only dashboard drift.
- Make future migration to another stack practical.

## Structure

- `migrations/` - database schema, policies, triggers, helper SQL
- `functions/` - Supabase Edge Functions
- `seed.sql` - optional bootstrap data for development
- `config.toml` - local Supabase CLI config for this project
- `config.toml.example` - placeholder template if you need to recreate local config

## Current Function Ownership

- `register-device` now owns browser/device registration for authenticated users
- `lock-device` and `unlock-device` now own trusted-device state changes and audit-event writes
- `create-signed-upload` requires an authenticated, trusted, unlocked browser before issuing a signed upload token
- `create-signed-download` requires an authenticated, recently signed-in, trusted, unlocked browser before issuing a signed download URL
- `cleanup-uploaded-file` removes orphaned encrypted uploads through the same trusted-device gate
- `audit-log` writes durable audit events for authenticated users
- `stripe-webhook` verifies Stripe signatures before synchronizing subscription rows

## What You Need To Connect Later

- Supabase project URL
- Supabase publishable key for browser/mobile clients
- Supabase service role key for local CLI/deploy workflows only, stored as `SERVICE_ROLE_KEY` for Edge Functions
- Database password / access for migration execution
- Stripe webhook signing secret stored as `STRIPE_WEBHOOK_SECRET`
- Stripe and other provider secrets as needed

## Edge Function Env

- Use `SUPABASE_URL` in local `--env-file` values for `supabase functions serve`
- Use `SERVICE_ROLE_KEY` for the service-role secret in both local env files and `supabase secrets set`
- Use `STRIPE_WEBHOOK_SECRET` for verified subscription webhook handling
- Do not try to store `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` with `supabase secrets set`; the CLI rejects names that start with `SUPABASE_`

## Protected Storage Flow

- Browser uploads are encrypted locally with Web Crypto before storage upload.
- The browser receives short-lived signed upload tokens from `create-signed-upload`.
- Direct client Storage policies for `user-documents` are removed by the hardening migration.
- Downloads receive short-lived signed URLs from `create-signed-download`.
- Encrypted file bytes are decrypted in the browser with the local wrapping key.
- Cross-device encrypted-file recovery is still deferred and must be designed before broad user onboarding.

## Local Verification

Run these after Docker Desktop is running:

```bash
supabase start
supabase test db --local
```

The pgTAP suite includes RLS, grant, subscription authority, and encryption-metadata assertions.

## Migration Push

- If the linked project already has bootstrap migrations applied, prefer:
  ```bash
  supabase db push --include-all
  ```
- That avoids the "remote migration versions not found in local migrations directory" error when history is already partially present on the server.

## Trust Boundary

- Client apps should receive only the Supabase URL and publishable key.
- Service-role credentials are for trusted server or operator workflows only.
- This repo keeps the backend definition in code so the project can be re-applied or migrated later without relying on dashboard-only state.

No credentials are required to keep this directory scaffolded and committed.
