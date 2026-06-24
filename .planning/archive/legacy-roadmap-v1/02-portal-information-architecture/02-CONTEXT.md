# Phase 2: Portal Information Architecture - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn the current portal preview into a clearer web account surface that explains categories, document status, cloud-only access, and device/security navigation. This phase stays on mock data and information architecture. It does not add live auth, billing, uploads, or real document retrieval.

</domain>

<decisions>
## Implementation Decisions

### Product posture
- **D-01:** The portal should read like a real account workspace, not a homepage gimmick.
- **D-02:** Web access must remain explicitly tied to cloud-backed accounts.
- **D-03:** The UI must keep honest trust language and avoid pretending secure file access is already fully wired.

### Information architecture
- **D-04:** The core portal navigation for this phase is Overview, Categories, Devices, and Security.
- **D-05:** Categories should anchor the mental model first; search and upgrade cues should support that model rather than compete with it.
- **D-06:** Status language should stay simple: saved, missing, soon, expired.

### Design direction
- **D-07:** Keep the presentation visually premium but calmer than the earlier busier explorations.
- **D-08:** Favor one strong portal shell with a main workspace and a smaller supporting rail instead of many separate sections.

### Technical baseline
- **D-09:** Continue using static snapshot data from `packages/config` for this phase.
- **D-10:** Keep browser-side Supabase handling placeholder-safe and limited to publishable credentials.

### the agent's Discretion
- Exact portal panel layout and supporting rail content
- How much marketing copy remains above the portal shell
- Whether to split `App.tsx` into components now or keep the prototype in one file for speed

</decisions>

<specifics>
## Specific Ideas

- Users should understand the product faster by seeing a believable workspace structure.
- The selected category should influence the portal category view and the supporting context rail.
- Search can be represented as an entry point now, even before real search exists.
- Upgrade framing should be direct: local-only stays off the web, cloud backup unlocks the portal.

</specifics>

<canonical_refs>
## Canonical References

### Product direction
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`

### Codebase reality
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `README.md`

### Existing implementation
- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- `packages/config/src/index.ts`
- `packages/types/src/index.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `prototypeSnapshot` already contains categories, template statuses, and trusted device mock data
- The web app already has the right high-level navigation labels for the portal
- The current design tokens already support a calm premium direction

### Established Patterns
- Static shared data drives the prototype instead of live backend calls
- The browser config posture is already aligned around placeholder-safe Supabase public credentials
- Portal sections are implemented as conditional views inside the main app shell

### Integration Points
- Portal IA changes land mainly in `apps/web/src/App.tsx` and `apps/web/src/styles.css`
- Search and cloud-access framing can be represented entirely in the UI without backend dependencies
- Future auth and document dashboard work should extend this shell rather than replace it

</code_context>

<deferred>
## Deferred Ideas

- Real search
- Live auth and session awareness
- Real document metadata retrieval
- Signed download and remote lock behavior
- Billing state and plan enforcement

</deferred>

---

*Phase: 02-portal-information-architecture*
*Context gathered: 2026-06-19*
