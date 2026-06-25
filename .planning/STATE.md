---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: rearchitecture
status: blocked
stopped_at: Phase 5 complete; Phase 6 remains blocked by parity findings around protected-route exposure and missing live-env verification
last_updated: "2026-06-25T02:45:00.000Z"
last_activity: 2026-06-24 -- Completed parity verification and found blockers that must be fixed before the swap/archive phase
progress:
  total_phases: 7
  completed_phases: 5
  total_plans: 5
  completed_plans: 5
  percent: 71
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-18)

**Core value:** No more lost docs. Everything the user needs in one app.
**Current focus:** Phase 06 — swap-and-archive (blocked)

## Current Position

Phase: 06 (swap-and-archive) — BLOCKED
Plan: 0 of 0
Status: Phase 05 verification completed; cutover is blocked pending remediation
Last activity: 2026-06-24 -- Route, metadata, asset, and secret-boundary verification completed; protected-route exposure and live-env gaps remain

Progress: [███████░░░] 71%

## Performance Metrics

**Velocity:**

- Total plans completed: 4
- Total plans completed: 5
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 1 | - | - |
| 02 | 1 | - | - |
| 03 | 1 | - | - |
| 04 | 1 | - | - |
| 05 | 1 | - | - |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- The Vite app remains the reference implementation until parity is verified.
- The production-grade path is now a parallel Next.js App Router app in `apps/web-next`.
- Runtime assets for the new app must resolve only from `apps/web-next/public`.
- The generated Next manifest route is now the canonical manifest target for the new app.
- Archive SEO and brand exports remain in `web_assets`; runtime references stay app-local.
- Protected dashboard and scan routing now live in the Next app through client-side session gates.
- The dashboard shell uses reusable components and prototype snapshot data until later protected-flow ports land.
- The Next app now owns the protected document-action, device, scan/upload, and contact surfaces while keeping the backend unchanged.
- Phase 5 verification confirmed that metadata/assets are in good shape and browser secret boundaries are clean, but protected-route exposure still blocks cutover.
- Mobile remains frozen until the web rearchitecture is stable.
- Internal `@doc-wallet/*` package names stay untouched until a dedicated cleanup phase after the swap.

### Pending Todos

- Remediate protected route exposure by moving auth gating server-side or equivalent and by removing protected URLs from the sitemap.
- Re-run Phase 5 verification with real `NEXT_PUBLIC_SUPABASE_*` values in a safe local or preview environment.
- Do not execute Phase 6 swap work until those parity blockers are cleared.

### Blockers/Concerns

- The active GSD phase artifacts from the legacy roadmap are archived and preserved for reference only.
- Phase 6 remains blocked even though Phase 5 artifacts are complete because the verification result did not clear the app for cutover.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Product | OCR/full-text search | Deferred to v2 | 2026-06-18 |
| Product | Family/emergency sharing | Deferred to v2 | 2026-06-18 |
| Compliance | HIPAA marketing claims | Blocked on legal review | 2026-06-18 |

## Session Continuity

Last session: 2026-06-24
Stopped at: Rearchitecture Phase 5 complete with blockers; Phase 6 is not yet a valid execution target
Resume file: None
