# Codebase Integrations

## Supabase

- Client wiring exists through `@doc-wallet/supabase`
- Web reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Shared helper supports `publishableKey` and legacy-compatible `anonKey` fallback
- Repository contains SQL for schema, RLS, and storage policies
- Repository contains placeholder edge functions for device and file access workflows

## Expo

- Mobile app depends on Expo 53 and React Native 0.79
- Current mobile scaffold is local only and does not yet implement camera, secure storage, or auth flows

## Web Bundler

- Web app uses Vite with local aliasing into workspace package source files
- Dev server is pinned to `127.0.0.1:5173`

## Deployment Targets

- Intended web deployment target is Vercel or equivalent static/frontend hosting
- Intended backend target is a single Supabase project for now

## Missing or Deferred Integrations

- No live Supabase project is linked in repo
- No Stripe implementation yet
- No OCR integration yet
- No analytics, error monitoring, or email provider integration yet
- No automated Supabase CLI workflow is committed yet

