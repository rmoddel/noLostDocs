# Codebase Architecture

## High-Level Shape

The repository is a small monorepo with one active user-facing surface, one deferred surface, a thin shared domain layer, and a code-first Supabase backend scaffold.

## Frontend Architecture

- `apps/web` is a single-page React application
- The current experience is a branded marketing-plus-portal prototype in one component tree
- UI state is local React state only
- Domain content is driven from `prototypeSnapshot` in the shared config package
- There is no routing, auth gate, API layer, or server rendering yet

## Shared Layer

- `packages/types` defines the current domain vocabulary
- `packages/config` centralizes placeholder env defaults and shared prototype content
- `packages/supabase` encapsulates client creation and placeholder detection

This layer keeps the web and mobile scaffolds aligned without introducing a full data or state management framework.

## Backend Architecture

- Supabase is treated as the system of record for future cloud-backed flows
- Schema and policy intent live in SQL migrations
- Edge functions are scaffolded as isolated handlers under `supabase/functions`
- Current functions return placeholder JSON and are not connected to real auth or storage behavior yet

## Architectural Tension To Track

- Planning documents describe a Next.js portal direction, but implemented web code is Vite
- Product direction is web-first, but the repo still carries a mobile app scaffold
- Security architecture is specified in migrations and docs, but the frontend is still prototype-only and not exercising those flows

