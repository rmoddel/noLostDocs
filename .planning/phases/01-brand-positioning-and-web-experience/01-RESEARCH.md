# Phase 1: Brand, Positioning, and Web Experience - Research

**Researched:** 2026-06-19
**Domain:** Web brand system, trust messaging, and safe Supabase client configuration
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use `NoLostDocs` in all user-facing web copy and avoid `wallet` terminology on the frontend.
- Keep the tagline locked as: "No more lost docs. Everything you need in one app."
- Position the product as a secure document vault and never as a legal replacement for original documents.
- The active delivery surface is the website; mobile stays deferred during this phase.
- Web access must be framed as a cloud-backed premium capability, not something local-only users should expect.
- Keep the existing Vite web app as the implementation surface for this phase rather than migrating to Next.js mid-phase.
- Shared client env naming should use Supabase `publishable key` terminology while preserving compatibility where needed.
- Checked-in env files must remain placeholder-only until the user connects a real Supabase project.
- Do not claim HIPAA compliance, zero-knowledge encryption, or stronger guarantees than the current implementation actually supports.

### the agent's Discretion
- Exact component decomposition for the website
- How aggressively to refactor the current monolithic `App.tsx`
- How much of the portal shell remains mock data versus live integration during this phase

### Deferred Ideas (OUT OF SCOPE)
- Real authentication and session handling
- Live cloud document retrieval and secure downloads
- Billing and plan enforcement
- Native mobile implementation work

</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Homepage brand narrative | Browser/Client | CDN/Static | Pure presentation and product communication |
| Portal shell preview | Browser/Client | API/Backend | UI is mocked now, but designed to receive real cloud state later |
| Supabase public client bootstrap | Browser/Client | API/Backend | Browser needs a safe public client entrypoint, but sensitive operations stay server-side |
| Trust and compliance copy | Browser/Client | — | Messaging must reflect actual implementation posture |
| Env placeholder management | Frontend Server | Browser/Client | Values are injected at build/runtime, but checked-in defaults must stay safe |

</architectural_responsibility_map>

<research_summary>
## Summary

The current repo already has the right strategic starting point for Phase 1: a premium-looking NoLostDocs website, shared TypeScript packages for configuration and Supabase wiring, and a code-authoritative Supabase scaffold. The missing piece is not invention but formalization. Phase 1 should turn that prototype into an explicit execution plan that locks copy, clarifies what is already correct, and finishes the repo alignment work around naming, trust language, and frontend structure.

For this phase, the standard approach is to keep the active web stack stable, sharpen the homepage and portal shell, and tighten the safe-client boundary. That means no service-role logic in browser code, placeholder-only env files in git, and honest product language that sells organization and access without overstating legal or compliance guarantees.

**Primary recommendation:** Treat Phase 1 as a web-brand hardening pass on the existing Vite app, with configuration cleanup and user-facing trust language brought into full alignment with the NoLostDocs direction.
</research_summary>

<standard_stack>
## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.0.0 | UI composition for the website | Already in use and shared with the deferred mobile surface |
| Vite | 6.3.5 | Fast local dev and production bundling for the current web app | Matches the implemented app and avoids premature migration churn |
| TypeScript | 5.8.3 | Shared typing across app and packages | Keeps product vocabulary consistent across surfaces |
| `@supabase/supabase-js` | workspace dependency | Public client for auth/data access from approved browser contexts | Standard Supabase client boundary for browser-safe usage |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vitejs/plugin-react` | 4.4.1 | React support in Vite | Required for the existing web build |
| Expo / React Native | deferred | Shared ecosystem continuity with later mobile work | Keep scaffolded, but do not let it drive Phase 1 scope |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite web app now | Next.js now | Better long-term app-router path, but migration mid-phase would dilute the branding and trust objectives |
| Shared placeholder snapshot | Immediate live Supabase queries | More realistic data, but would blur a brand phase into a backend integration phase |

**Installation:**
```bash
npm install
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```text
User browser
  |
  v
NoLostDocs web shell (hero + trust narrative + portal preview)
  |
  +--> shared prototype snapshot (@doc-wallet/config)
  |
  +--> safe client bootstrap (@doc-wallet/supabase)
  |
  +--> future authenticated cloud flows
         |
         v
     Supabase auth / data / storage
```

### Recommended Project Structure
```text
apps/web/src/
├── App.tsx          # Current top-level prototype shell
├── main.tsx         # React entry
└── styles.css       # Global design system and page styling
```

### Pattern 1: Shared copy and state seed
**What:** Keep prototype content and seeded portal state in a shared package instead of scattering literals across apps.
**When to use:** Early product phases where UX needs to move faster than backend integration.

### Pattern 2: Safe public client wrapper
**What:** Centralize Supabase browser client creation in one helper that only accepts safe public inputs.
**When to use:** Any frontend phase that needs env wiring or configuration messaging before backend features are live.

### Anti-Patterns to Avoid
- **Premature stack migration:** Switching to Next.js during Phase 1 would add churn without improving the brand outcome.
- **Marketing beyond implementation:** Claims like HIPAA-compliant or zero-knowledge would create trust debt immediately.
- **Prototype drift:** Letting app code, README, and planning files describe different product names or platform priorities.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser Supabase bootstrap | ad hoc client creation in multiple components | shared `packages/supabase` helper | prevents config drift and unsafe key handling |
| Product vocabulary | scattered hard-coded copy decisions | `CONTEXT.md` + roadmap + shared config | keeps brand and trust decisions durable |
| Backend ownership story | dashboard-only Supabase setup | code-first `supabase/` scaffold | preserves portability and reviewability |

**Key insight:** Phase 1 wins by consolidating decisions, not by introducing more infrastructure.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Brand says one thing, repo says another
**What goes wrong:** The website says NoLostDocs while docs, package names, and setup files still imply a different product or scope.
**Why it happens:** Rename work is often partial and the technical substrate lags behind the frontend.
**How to avoid:** Audit every user-facing surface and decide explicitly which internal names are intentionally deferred.
**Warning signs:** README, env examples, and frontend copy disagree.

### Pitfall 2: Trust copy outruns implementation
**What goes wrong:** The site implies legal acceptance, healthcare compliance, or stronger privacy guarantees than the product can prove.
**Why it happens:** Marketing language gets written before architecture is validated.
**How to avoid:** Tie every security statement to code or documented backend posture already present in repo.
**Warning signs:** Claims that cannot be pointed back to migrations, policies, or configuration boundaries.

### Pitfall 3: Brand phase silently absorbs platform migration
**What goes wrong:** The team loses momentum by rebuilding the website stack instead of improving the actual experience.
**Why it happens:** Architecture aspirations get mixed into a design/copy phase.
**How to avoid:** Keep Vite for Phase 1 and reserve framework migration for a later explicit phase if still needed.
**Warning signs:** Planning tasks start centering on routing, SSR, or deployment changes instead of UX and trust.
</common_pitfalls>

<code_examples>
## Code Examples

### Safe public client resolution
```typescript
export function resolveSupabaseEnv(env: SupabaseEnv) {
  const url = env.url ?? DEFAULT_SUPABASE_URL;
  const publishableKey = env.publishableKey ?? env.anonKey ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  return {
    url,
    publishableKey,
    configured: !isPlaceholderValue(url) && !isPlaceholderValue(publishableKey)
  };
}
```

### Placeholder env example
```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Referring only to Supabase anon keys everywhere | Prefer publishable-key terminology in client-facing setup | recent Supabase documentation direction | Better matches current docs while preserving client-safe semantics |
| Treating landing pages and product portals as separate aesthetic systems | Strong unified marketing-plus-product shells | current product design norm | The homepage should preview the portal rather than feel disconnected from it |

**New tools/patterns to consider:**
- Phase-specific codebase maps inside `.planning/codebase/` reduce drift between roadmap intent and actual implementation.
- Shared config packages are enough for a web-first prototype before heavier state or CMS adoption.

**Deprecated/outdated:**
- Placeholder “coming soon” landing pages that do not teach the product model
- Security claims that rely on dashboard settings rather than code-backed policy artifacts
</sota_updates>

<open_questions>
## Open Questions

- Whether internal package scope should be renamed away from `@doc-wallet/*` during Phase 1 or explicitly deferred
- Whether the current single-component `App.tsx` should be split during this phase or left until auth/dashboard work begins
- Whether the Vite-to-Next migration should ever happen, or whether Vite remains sufficient for the flagship site
</open_questions>
