# Phase 5: Plan Enforcement & Premium Access - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase defines and enforces the product boundary between free basic access and premium cloud-backed access, using login-required accounts, email-based recovery, and backend-owned plan/quota checks.

</domain>

<decisions>
## Implementation Decisions

### Product stance
- All users must log in; anonymous or local-only accountless usage is no longer the product direction.
- Free users get the basic tier.
- Premium users get the broader cloud-backed feature set and the remaining category groups.
- Email-based account recovery is required for every user account.
- Encryption language should stay recovery-capable and must not claim zero-knowledge.

### Enforcement model
- Plan state should resolve from `profiles` plus active Stripe-backed subscription state.
- Web and mobile should both present the same free-versus-premium boundary, even if UI detail differs by surface.
- Backend-owned edge functions should enforce at least one real quota/eligibility check instead of relying on UI-only hiding.

### the agent's Discretion
- Exact free-tier quota numbers, as long as they are conservative and easy to reason about.
- The specific copy and panel placement for upgrade messaging on each surface.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `public.profiles` already contains `plan` and `cloud_enabled` columns.
- `public.subscriptions` already exists, along with RLS and updated-at triggers.
- `supabase/functions/stripe-webhook` and `supabase/functions/create-signed-upload` already exist as placeholders.
- The web app already has a signed-in dashboard and the mobile app already has a mode-selection onboarding flow.

### Established Patterns
- Browser Supabase usage stays publishable-key-only and should tolerate placeholder credentials.
- Trust boundaries are communicated explicitly in product copy rather than hidden in implementation assumptions.
- Demo fallback behavior is acceptable when live backend configuration is missing, as long as the app stays honest.

### Integration Points
- Web plan gating belongs in `apps/web/src/App.tsx`.
- Mobile plan framing belongs in `apps/mobile/App.tsx`.
- Backend plan synchronization and quota enforcement belong in Supabase Edge Functions plus small SQL migrations if needed.

</code_context>

<specifics>
## Specific Ideas

- Free/basic should map cleanly onto the existing `Basic` launcher group.
- Premium should unlock the non-basic groups rather than only changing copy.
- Account status should be visible enough that a user understands why a category or action is gated.

</specifics>

<deferred>
## Deferred Ideas

- Rich billing UI and hosted customer portal flows.
- Full cryptographic recovery design beyond the product-language decision.
- Production Stripe signature verification and secret wiring.

</deferred>
