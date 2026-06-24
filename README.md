# NoLostDocs

Secure document vault monorepo for NoLostDocs.

Current product direction:

- Web-first execution is the active path
- Every user authenticates before using the product
- `Free Basic` covers the core document group
- `Premium` unlocks the broader cloud-backed workspace
- Web access is explicitly cloud-backed and recovery-oriented

Repo structure:

- `apps/web` - web-first product and portal surface
- `apps/mobile` - mobile prototype aligned to the same Free Basic vs Premium model
- `packages/*` - shared config, types, and Supabase helpers
- `supabase/` - schema, RLS, storage policy, and Edge Functions in git

## Environment

This repo is wired for a single Supabase project.

Frontend browser/mobile values live in:

- [apps/web/.env.local.example](/Users/rmoddel/code/rmo/work/NoLostDocs/apps/web/.env.local.example)
- [apps/mobile/.env.example](/Users/rmoddel/code/rmo/work/noLostDocs/apps/mobile/.env.example)

These are browser-safe placeholders only. Real values should be added locally after you connect your Supabase project. Do not put service-role credentials in Vite env files.

Server-side local secrets should live in a root `.env.local` for operator and backend workflows. Do not expose service-role or Stripe secret values to the browser build.

Copy frontend placeholders locally:

```bash
cp apps/web/.env.local.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

## Install

```bash
npm install
```

## Run

```bash
npm run dev
npm run dev:web
```

## Deploy

Production target: AWS Amplify.

- Root build config lives in [amplify.yml](/Users/rmoddel/code/rmo/work/noLostDocs/amplify.yml)
- Amplify should build from the repo root
- Build command: `npm run build:web`
- Output directory: `apps/web/dist`

Required Amplify environment variables for the web app:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Server-side secrets such as `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` should stay in trusted backend/operator workflows, not browser-exposed Amplify frontend env vars.

## Current App Direction

- Signed-in web dashboard with category-first browsing
- Persistent visible/hidden dashboard category preferences
- Protected preview/download UI framed as authorized short-lived access
- Login-required plan model across the product
- `Free Basic` gating versus `Premium` unlock messaging on web and mobile
- Backend-owned subscription sync and upload quota enforcement scaffolding
- AWS Amplify as the intended production host for the web app

## Trust Boundary

- Browser code uses the Supabase URL plus publishable key only.
- Service-role keys are server/CLI-only and belong in deployment or local admin workflows, not in frontend env files.
- Web access is the cloud-backed surface; local-only behavior is intentionally not implied on the website.
- NoLostDocs is a secure document vault and recovery tool, not a legal replacement for official originals.
- Product language should stay recovery-capable and should not claim HIPAA compliance or zero-knowledge guarantees that the implementation does not prove.

## Current Status

- Phases 1 through 5 are implemented in-repo
- Current planning focus is Phase 6: hardening, audit, and launch readiness
- The remaining live blocker is creating and validating the real AWS Amplify environment

## Verification

- `npm run typecheck`
- `npm run build:web`
