# Phase 8: Package Naming Cleanup - Context

**Gathered:** 2026-06-25
**Status:** Complete

## Objective

Remove the remaining internal `doc-wallet` naming debt from workspace package scope, package references, and active project docs so the codebase matches the NoLostDocs product name.

## Scope

- Rename active workspace package names from `@doc-wallet/*` to `@nolostdocs/*`
- Update imports, TS path aliases, workspace scripts, and the archived Vite reference app package metadata
- Refresh the npm lockfile so installs resolve the new names consistently
- Update active planning docs that still described the old scope as pending work

## Implementation Decisions

- Keep archived milestone artifacts untouched unless they are part of the active milestone record
- Rename the Supabase helper factory to `createNoLostDocsSupabaseClient` to remove the last active code-level `DocWallet` identifier
- Align the paused Expo app metadata with NoLostDocs while leaving mobile scope paused
