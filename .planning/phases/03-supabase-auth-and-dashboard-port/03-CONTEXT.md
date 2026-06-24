# Phase 3: Supabase, Auth, and Dashboard Port - Context

**Gathered:** 2026-06-24
**Status:** Complete

## Objective

Port the signed-in shell into `apps/web-next` so the new app supports real login, protected dashboard and scan routes, and a reusable category-first dashboard structure.

## Scope

- Wire browser auth through Supabase publishable credentials
- Keep server-side auth scaffolding isolated for later SSR work
- Redirect logged-out users away from protected routes
- Port the dashboard shell and category structure from the Vite prototype
- Defer device controls, protected downloads, and upload/contact mutations to later phases
