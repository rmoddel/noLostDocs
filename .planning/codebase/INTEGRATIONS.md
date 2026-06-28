# Codebase Integrations

## Supabase

- Client wiring exists through `@nolostdocs/supabase`
- Web reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Shared helper supports `publishableKey` and legacy-compatible `anonKey` fallback
- Repository contains SQL for schema, RLS, and storage policies
- Repository contains placeholder edge functions for device and file access workflows

## Expo

- Mobile app depends on Expo 53 and React Native 0.79
- Current mobile scaffold is local only and does not yet implement camera, secure storage, or auth flows

## Web Bundler

- Live web app uses Next.js App Router in `apps/web`
- Archived Vite reference app remains in `apps/web-vite-reference`

## Deployment Targets

- Intended web deployment target is Vercel or equivalent static/frontend hosting
- Intended backend target is a single Supabase project for now

## Missing or Deferred Integrations

- No live Supabase project is linked in repo
- No Stripe implementation yet
- Scanbot SDK is the selected guided-capture layer; the live app currently falls back to browser capture until a Scanbot license is configured
- ABBYY FineReader is the selected OCR layer; the live app records OCR readiness and quality metadata, while extraction stays gated on deploy-time ABBYY connector setup
- No analytics, error monitoring, or email provider integration yet
- No automated Supabase CLI workflow is committed yet
