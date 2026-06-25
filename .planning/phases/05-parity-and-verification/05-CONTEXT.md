# Phase 5: Parity and Verification - Context

**Gathered:** 2026-06-24
**Status:** In Progress

## Objective

Verify that `apps/web-next` is ready for cutover consideration by checking route coverage, public metadata and assets, auth-gated portal behavior, protected-flow wiring, and browser/backend safety assumptions.

## Scope

- Re-verify production build and type safety
- Verify public homepage and route coverage
- Verify metadata, manifest, robots, sitemap, and runtime asset delivery
- Verify auth-gated dashboard and scan behavior as implemented in the Next app
- Verify protected-flow code paths and browser secret boundaries
- Confirm the Vite prototype still exists as the fallback/reference implementation

## Verification Sources

- Runtime route and asset checks from the local Next dev/build output
- Source inspection in `apps/web-next/`
- Shared package and env inspection in `packages/config`, `packages/supabase`, and `apps/web-next/lib/supabase`
- Repo structure checks confirming `apps/web` remains present and unswapped

## Expected Exit Condition

Phase 5 should produce a concrete parity report that either:

1. clears the app for Phase 6 swap planning, or
2. records the remaining gaps that block cutover.
