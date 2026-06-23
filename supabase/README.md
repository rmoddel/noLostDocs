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
- `config.toml.example` - placeholder local config

## Current Function Ownership

- `register-device` now owns browser/device registration for authenticated users
- `lock-device` and `unlock-device` now own trusted-device state changes and audit-event writes
- These functions are scaffolded in code so the behavior can move with the repo instead of living only in the Supabase dashboard

## What You Need To Connect Later

- Supabase project URL
- Supabase publishable key for browser/mobile clients
- Supabase service role key for local CLI/deploy workflows only
- Database password / access for migration execution
- Stripe and other webhook secrets as needed

## Trust Boundary

- Client apps should receive only the Supabase URL and publishable key.
- Service-role credentials are for trusted server or operator workflows only.
- This repo keeps the backend definition in code so the project can be re-applied or migrated later without relying on dashboard-only state.

No credentials are required to keep this directory scaffolded and committed.
