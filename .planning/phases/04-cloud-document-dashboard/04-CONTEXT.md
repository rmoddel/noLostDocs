# Phase 4: Cloud Document Dashboard - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the signed-in cloud document dashboard: category-first browsing, visually obvious status/completeness, and honest authorized-action states that distinguish metadata browsing from secure file access.

</domain>

<decisions>
## Implementation Decisions

### Dashboard hierarchy
- Keep the category-first launcher pattern as the primary signed-in dashboard entry.
- Keep selected-category documents in the main workspace and reserve the support rail for secondary context like next actions and devices.
- Continue using the simple status language `Saved`, `Missing`, `Soon`, and `Expired`.
- Repeat the web trust boundary in short form: this surface is for metadata browsing and authorized short-lived access, not a full local vault.

### Secure access behavior
- Label protected actions explicitly as `Authorized preview` and `Authorized download`.
- Before full file access is wired, use realistic access states such as available, restricted, reauth required, and session-expired rather than fake working downloads.
- Put the access-model explanation behind a tooltip or modal instead of inline helper copy beside every action.

### Visibility and status handling
- Keep a user-controlled visible category set on the main dashboard and move hidden categories into a secondary manage/reveal surface.
- Keep visibility controls lightweight and close to the category section instead of sending users to a separate settings screen.
- Use status color plus saved-count summaries at the group level, and show clearer expiration/completeness cues in document detail.
- Do not auto-hide weak categories; if a category is visible, missing items should stay visible and actionable.

### Data source and scope
- Wire Supabase-backed category visibility preferences first.
- Keep strong visual parity between the public launcher and the signed-in dashboard.
- Keep device and security content secondary while document discovery remains primary.
- Refactor only where it meaningfully clarifies the dashboard implementation; avoid a broad architecture rewrite.

### the agent's Discretion
- The exact document-detail interaction pattern within the signed-in dashboard.
- Whether to extract small presentational components from `App.tsx` while implementing Phase 4.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/App.tsx` already contains the public launcher, signed-in dashboard shell, auth flow, and device controls in one file.
- `packages/config/src/index.ts` already provides category, template, and device snapshot data that can keep demo mode useful while live wiring stays partial.
- `supabase/functions/create-signed-download/index.ts` and `supabase/functions/audit-log/index.ts` already exist as code-owned placeholders for protected access flows.

### Established Patterns
- The web app uses a category-first visual hierarchy with large launcher cards and smaller status-aware document actions.
- Supabase browser access is guarded by the `configured` flag and falls back cleanly to local demo behavior when credentials are absent.
- Trust language stays concise, explicit, and repeated across public and signed-in states.

### Integration Points
- Signed-in dashboard work belongs primarily in `apps/web/src/App.tsx` and `apps/web/src/styles.css`.
- Live preference persistence should use the current public Supabase client and a user-owned table protected by RLS.
- Protected action messaging can anchor on the existing signed-download and audit-log edge-function placeholders without claiming full delivery.

</code_context>

<specifics>
## Specific Ideas

- The signed-in dashboard should feel like the natural unlocked version of the public launcher instead of a different product.
- Hidden categories should remain recoverable from the same screen.
- The detail surface should make expiration, completeness, and access posture easier to understand than the current button list.

</specifics>

<deferred>
## Deferred Ideas

- Fully live document/category ingestion from Supabase beyond visibility preferences.
- Real signed preview generation and production-grade audit event review tooling.
- Broader billing or quota decisions that belong to Phase 5.

</deferred>
