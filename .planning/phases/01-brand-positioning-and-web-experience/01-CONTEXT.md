# Phase 1: Brand, Positioning, and Web Experience - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the NoLostDocs brand, premium web-first visual language, honest trust messaging, and foundational frontend configuration posture for the current website. This phase covers the flagship website experience and the product language around cloud-backed access, but does not include live auth, billing, or real document retrieval flows.

</domain>

<decisions>
## Implementation Decisions

### Brand and language
- **D-01:** Use `NoLostDocs` in all user-facing web copy and avoid `wallet` terminology on the frontend.
- **D-02:** Keep the tagline locked as: "No more lost docs. Everything you need in one app."
- **D-03:** Position the product as a secure document vault and never as a legal replacement for original documents.

### Scope and platform posture
- **D-04:** The active delivery surface is the website; mobile stays deferred during this phase.
- **D-05:** Web access must be framed as a cloud-backed premium capability, not something local-only users should expect.
- **D-06:** This phase should strengthen design, copy, and trust architecture without pretending the backend flows are already complete.

### Technical baseline
- **D-07:** Keep the existing Vite web app as the implementation surface for this phase rather than migrating to Next.js mid-phase.
- **D-08:** Shared client env naming should use Supabase `publishable key` terminology while preserving compatibility where needed.
- **D-09:** Checked-in env files must remain placeholder-only until the user connects a real Supabase project.

### Trust and compliance messaging
- **D-10:** Do not claim HIPAA compliance, zero-knowledge encryption, or stronger guarantees than the current implementation actually supports.
- **D-11:** Security messaging should emphasize private buckets, RLS, short-lived access, and no browser-side service-role credentials.

### the agent's Discretion
- Exact component decomposition for the website
- How aggressively to refactor the current monolithic `App.tsx`
- How much of the portal shell remains mock data versus live integration during this phase

</decisions>

<specifics>
## Specific Ideas

- The site should feel calm, premium, and serious rather than like a generic productivity dashboard.
- The current portal preview is directionally correct because it introduces dashboard, categories, devices, and security views without pretending everything is live.
- The repo should reflect that Supabase ownership lives in code under `supabase/`, even before credentials are connected.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product direction
- `.planning/PROJECT.md` — current name, scope, platform constraints, and web-first direction
- `.planning/ROADMAP.md` — phase goals, success criteria, and plan boundaries
- `.planning/REQUIREMENTS.md` — requirement IDs and out-of-scope constraints for v1
- `.planning/STATE.md` — current execution posture and recorded blockers

### Codebase reality
- `.planning/codebase/STACK.md` — current stack and active surfaces
- `.planning/codebase/ARCHITECTURE.md` — implemented architecture and current tensions
- `.planning/codebase/CONCERNS.md` — known repo inconsistencies and execution risks
- `README.md` — public repo setup and current environment documentation

### Existing implementation
- `apps/web/src/App.tsx` — current NoLostDocs web prototype and portal shell
- `apps/web/src/styles.css` — current design system and premium styling baseline
- `packages/config/src/index.ts` — shared placeholder values and prototype snapshot
- `packages/supabase/src/index.ts` — shared client bootstrap and publishable-key handling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/App.tsx`: already contains the main homepage, use-case sections, and portal navigation prototype
- `apps/web/src/styles.css`: already contains a custom premium visual language with tokens, panel styles, and portal layout classes
- `packages/config/src/index.ts`: central source for placeholder env defaults and seeded prototype content
- `packages/supabase/src/index.ts`: existing Supabase client helper keeps env handling out of app code

### Established Patterns
- Web prototype content is currently driven from shared static snapshot data instead of live queries
- Workspace packages are consumed directly from source aliases in Vite rather than built package outputs
- Supabase infrastructure intent is kept in code under `supabase/`, even though live deployment is not yet wired

### Integration Points
- Brand and copy changes connect directly to `apps/web/src/App.tsx` and `apps/web/src/styles.css`
- Trust messaging and env-safe configuration connect to `packages/config`, `packages/supabase`, and `README.md`
- Future auth and cloud document phases will build on the current portal shell rather than replacing it from scratch

</code_context>

<deferred>
## Deferred Ideas

- Real authentication and session handling belong to Phase 3
- Live document metadata and secure downloads belong to Phase 4
- Billing and plan enforcement belong to Phase 5
- Mobile onboarding, local-only storage, and biometric flows remain deferred to the mobile track

</deferred>

---

*Phase: 01-brand-positioning-and-web-experience*
*Context gathered: 2026-06-19*
