---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: rearchitecture
status: active
stopped_at: Security hardening implemented; Supabase local tests blocked on Docker
last_updated: "2026-09-08T03:30:00.000Z"
last_activity: 2026-09-08 -- Implemented security overhaul priority list and app-first homepage
progress:
  total_phases: 8
  completed_phases: 8
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-18)

**Core value:** No more lost docs. Everything the user needs in one app.
**Current focus:** Security hardening and app-first web experience

## Current Position

Phase: 08 complete
Plan: 8 of 8
Status: Rearchitecture complete; security hardening implemented with local Supabase validation pending
Last activity: 2026-09-08 -- Implemented security overhaul priority list and app-first homepage

Progress: [██████████] 100%

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
- The production-grade path is now the live Next.js App Router app in `apps/web`.
- Runtime assets for the live app resolve only from `apps/web/public`.
- The generated Next manifest route is now the canonical manifest target for the new app.
- Archive SEO and brand exports remain in `web_assets`; runtime references stay app-local.
- Protected dashboard and scan routing now live in the Next app through server-side redirects.
- The dashboard shell uses reusable components and prototype snapshot data until later protected-flow ports land.
- The Next app now owns the protected document-action, device, scan/upload, and contact surfaces while keeping the backend unchanged.
- Phase 5 verification was followed by a cutover pass that moved the verified Next app into `apps/web` and archived the Vite prototype as `apps/web-vite-reference`.
- Mobile remains frozen until the web rearchitecture is stable.
- Internal workspace package names now use the `@nolostdocs/*` scope.

### Pending Todos

- Re-run Phase 5 verification with real `NEXT_PUBLIC_SUPABASE_*` values in a safe local or preview environment.
- Configure commercial Scanbot and ABBYY credentials in the deployment environment when enabling guided capture and OCR extraction.
- Start Docker Desktop, run `supabase start`, then run `supabase test db --local`.
- Configure `STRIPE_WEBHOOK_SECRET` before enabling Stripe subscription sync in production.
- Design multi-device/recovery-key support before inviting users to rely on encrypted document recovery across devices.

### Blockers/Concerns

- The active GSD phase artifacts from the legacy roadmap are archived and preserved for reference only.
- The milestone code is complete, but live launch still depends on real environment configuration and backend project setup outside the repo.
- Local pgTAP validation could not run because Docker Desktop is not running.
- Encrypted uploads use a local browser wrapping key; cross-device recovery remains deferred.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260707-egp | Implement overlay-first scan modal launched from dashboard with /scan redirect fallback | 2026-07-07 | uncommitted | [260707-egp-implement-overlay-first-scan-modal-launc](./quick/260707-egp-implement-overlay-first-scan-modal-launc/) |
| 260709-kwp | Fix documents category foreign key to document_categories | 2026-07-09 | uncommitted | [260709-kwp-fix-documents-category-foreign-key-to-do](./quick/260709-kwp-fix-documents-category-foreign-key-to-do/) |
| 260908-security | Implement security overhaul priority list and app-first homepage | 2026-09-08 | uncommitted | [260908-security-overhaul-priority-list](./quick/260908-security-overhaul-priority-list/) |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Product | OCR/full-text search | Deferred to v2 | 2026-06-18 |
| Product | Family/emergency sharing | Deferred to v2 | 2026-06-18 |
| Compliance | HIPAA marketing claims | Blocked on legal review | 2026-06-18 |

## Session Continuity

Last session: 2026-06-25
Stopped at: Rearchitecture milestone complete
Resume file: None
