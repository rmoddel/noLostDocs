# Phase 4: Protected Flows Port - Context

**Gathered:** 2026-06-24
**Status:** In Progress

## Objective

Port the sensitive signed-in flows from the Vite prototype into `apps/web-next` so the new app supports the real trust model: protected document actions, device controls, scan/upload, contact submission, and visible plan boundaries.

## Scope

- Preserve the existing document access model for preview/download states
- Reuse the existing Supabase Edge Functions without rewriting backend code
- Port device registration and lock/unlock controls into reusable dashboard components
- Port scan capture, rotation, validation, signed upload, and row creation flows
- Port the contact form and signed-in prefill behavior
- Keep the Vite prototype untouched as the reference implementation

## Reference Behavior

- `apps/web/src/App.tsx` already contains the working prototype logic for:
  - access-state mapping and protected action messaging
  - device registration plus lock/unlock flows
  - contact-submit invocation
  - create-signed-download invocation
  - create-signed-upload plus storage upload and row creation
- `apps/web-next/components/dashboard/DashboardShell.tsx` already owns the signed-in shell and plan-aware category UI that these flows should plug into
