# Codebase Conventions

## Naming and Product Language

- Product-facing name is `NoLostDocs`
- Frontend copy should avoid `wallet` branding
- Internal package scope still uses `@doc-wallet/*`, which is currently a technical carryover

## Environment Handling

- Checked-in env files must use placeholders only
- Real Supabase values are intended to be dropped in locally after scaffold completion
- Web uses `VITE_SUPABASE_*` naming
- Shared code prefers `publishableKey` terminology while allowing legacy `anonKey` fallback

## Workspace Patterns

- npm workspaces manage apps and packages from the root
- Shared code is consumed directly from source via aliases instead of prebuilt package output

## Frontend Patterns

- Web UI is currently implemented as a single high-level component with small local computed sections
- Styling is centralized in one CSS file with custom properties for branding and tone
- Prototype content currently comes from shared static snapshot data, not live queries

## Backend Patterns

- Database and access-control intent must live in code under `supabase/`
- Edge functions are organized one function per folder with Deno `index.ts` entrypoints
- Security-sensitive backend behavior is expected to stay out of client code

