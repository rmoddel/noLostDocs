# NoLostDocs

Web-first prototype monorepo for NoLostDocs:

- `apps/web` - web-first product and portal surface
- `apps/mobile` - deferred mobile prototype work
- `packages/*` - shared config, types, and Supabase helpers
- `supabase/` - schema, RLS, storage policy, and Edge Functions in git

## Environment

This repo is wired for a single Supabase project, but the checked-in env files use placeholders only.

Web values live in:

- [apps/web/.env.local.example](/Users/rmoddel/code/rmo/work/NoLostDocs/apps/web/.env.local.example)

These are browser-safe placeholders only. Real values should be added locally after you connect your Supabase project. Do not put service-role credentials in Vite env files.

Then copy them locally:

```bash
cp apps/web/.env.local.example apps/web/.env.local
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

## Current Prototype Scope

- NoLostDocs branding and copy
- Web-only product experience for now
- Cloud-backed web portal direction with placeholder-safe Supabase wiring
- Placeholder-safe env handling so real project values can be dropped in later
- Supabase schema, RLS, storage policy, and edge-function scaffolding kept in code

## Trust Boundary

- Browser code uses the Supabase URL plus publishable key only.
- Service-role keys are server/CLI-only and belong in deployment or local admin workflows, not in frontend env files.
- Web access is the cloud-backed surface; local-only behavior is intentionally not implied on the website.

## Verification

- `npm run typecheck`
- `npm run build:web`
