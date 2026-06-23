# Codebase Stack

## Runtime and Languages

- TypeScript across web, mobile, shared packages, and Supabase function scaffolding
- React 19 for both web and mobile surfaces
- Node-based workspace tooling via npm workspaces

## Applications

- `apps/web`: Vite 6 + React 19 web prototype
- `apps/mobile`: Expo 53 + React Native 0.79 deferred mobile prototype

## Shared Packages

- `packages/config`: shared placeholder env defaults and prototype data
- `packages/types`: shared domain types for categories, documents, devices, and snapshot state
- `packages/supabase`: shared Supabase client bootstrap helper

## Backend and Infrastructure

- Supabase intended as the single backend for auth, Postgres, storage, and edge functions
- SQL migrations checked into `supabase/migrations`
- Supabase Edge Function placeholders checked into `supabase/functions`

## Current Product Direction

- Immediate product focus is web-only
- Mobile remains scaffolded but is not the active delivery surface
- Current web implementation is Vite, even though longer-term planning notes still mention Next.js

## Tooling

- TypeScript compiler for typechecking
- Vite build pipeline for the web app
- Expo tooling for the mobile app

