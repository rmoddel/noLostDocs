# Phase 3 Research Notes

**Date:** 2026-06-19

## Findings

1. The repo already had the right backend shape in schema and RLS, but the device edge functions were still placeholders.
2. The web prototype already had a devices view, so the most efficient next step was to turn it into a real session-aware shell.
3. Since live credentials are intentionally absent from git, demo fallback is necessary for a usable local prototype.

## Outcome

Phase 3 should ship as integration-ready scaffolding: real auth calls, real devices queries, real edge-function contracts, and honest fallback states.
