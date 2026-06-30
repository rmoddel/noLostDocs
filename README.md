# NoLostDocs

NoLostDocs is a secure document vault for keeping important records organized, recoverable, and easy to trust.

## What It Is

- A public brand site
- A signed-in document workspace
- A recovery-first account model
- A paid upgrade path for broader document coverage
- A product that stays honest about legal acceptance and original documents

## Launch And Revenue

To get this live:

1. Set the production domain for the app host.
2. Populate the live web environment with the public backend values and the server-only secrets.
3. Build and deploy the web app from `apps`.
4. Verify the public homepage, login, dashboard, scan, sitemap, and metadata routes.
5. Keep the archived prototype untouched until the live app is proven in production.

To make money:

1. Keep `Free Basic` as the entry tier and gate the broader cloud workspace behind `Premium`.
2. Make the upgrade path obvious from the dashboard and plan-status surfaces.
3. Connect billing to the premium account state before exposing advanced cloud features.
4. Use the homepage to sell trust, recovery, and organization, not hype.

## Environment

This repo is wired for a single backend project.

Frontend web values live in:

- [apps/.env.local.example](/Users/rmoddel/code/rmo/work/noLostDocs/apps/.env.local.example)

These are browser-safe placeholders only. Real values should be added locally after you connect your backend project. Do not put service-role credentials in frontend env files.

Server-side local secrets should live in a root `.env.local` for operator and backend workflows. Do not expose service-role or payment secret values to the browser build.

Copy frontend placeholders locally:

```bash
cp apps/.env.local.example apps/.env.local
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

Production target: your configured hosting platform.

- Root build config lives in [amplify.yml](/Users/rmoddel/code/rmo/work/noLostDocs/amplify.yml)
- Build command: `npm run build:web`
- Output directory: the platform build output for `apps`

Required frontend environment variables for the web app:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SCANBOT_LICENSE_KEY` when enabling guided Scanbot capture

Server-side secrets such as the service-role key, payment secret key, and ABBYY OCR connector values should stay in trusted backend/operator workflows, not browser-exposed frontend env vars.

## Current App Direction

- Signed-in web workspace with category-first browsing
- Persistent visible/hidden workspace category preferences
- Protected preview/download UI framed as authorized short-lived access
- Login-required plan model across the product
- `Free Basic` gating versus `Premium` unlock messaging on the responsive web app
- Backend-owned subscription sync and upload quota enforcement scaffolding

## Trust Boundary

- Browser code uses the public backend URL plus publishable key only.
- Service-role keys are server/CLI-only and belong in deployment or local admin workflows, not in frontend env files.
- Web access is the responsive cloud-backed surface; local-only behavior is intentionally not implied on the website.
- NoLostDocs is a secure document vault and recovery tool, not a legal replacement for official originals.
- Product language should stay recovery-capable and should not claim HIPAA compliance or zero-knowledge guarantees that the implementation does not prove.

## Current Status

- The live web app is deployed from `apps`
- Archived legacy app variants were moved out of the active app path
- The selected Phase 7 stack is `Scanbot SDK` for guided capture and `ABBYY FineReader` for accuracy-oriented OCR
- Active internal workspace packages now use the `@nolostdocs/*` scope

## Verification

- `npm run typecheck`
- `npm run build:web`
