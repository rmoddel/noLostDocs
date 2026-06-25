# Roadmap: NoLostDocs Rearchitecture

## Overview

NoLostDocs is shifting from a Vite prototype into a production-grade Next.js web architecture. The current roadmap tracks the rearchitecture sequence only. Legacy web-first milestone artifacts remain archived for reference and do not define the active execution order.

## Phases

- [x] **Phase 1: Next Foundation** - Build a parallel `apps/web-next` App Router foundation with real homepage content, metadata, isolated runtime assets, and baseline Supabase scaffolding.
- [x] **Phase 2: Asset and Design Source-of-Truth Cleanup** - Consolidate runtime asset usage and tighten the design system so the new app has one clear visual and asset pipeline.
- [x] **Phase 3: Supabase, Auth, and Dashboard Port** - Port login, session handling, protected routes, and dashboard skeleton behavior into the Next app.
- [x] **Phase 4: Protected Flows Port** - Port device controls, protected downloads, scan/upload, contact, and plan-boundary flows into the Next app.
- [x] **Phase 5: Parity and Verification** - Prove that the Next app reaches launch-ready parity across homepage, auth, dashboard, assets, metadata, and backend safety.
- [ ] **Phase 6: Swap and Archive** - Replace the Vite app only after parity is verified by promoting `apps/web-next` to the final web app and archiving the Vite prototype safely.
- [ ] **Phase 7: Package Naming Cleanup** - Rename internal `@doc-wallet/*` packages to `@nolostdocs/*` after the rearchitecture is stable.

## Phase Details

### Phase 1: Next Foundation
**Goal**: As the NoLostDocs team, we need a production-grade Next.js foundation running in parallel with the Vite prototype so that future web work lands on the right architecture without breaking the reference implementation.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: [ARCH-01, WEB-FOUND-01]
**Success Criteria** (what must be TRUE):
  1. `apps/web-next` exists as a valid Next.js App Router app.
  2. The homepage renders real NoLostDocs content and reflects the approved visual direction.
  3. Metadata, robots, sitemap, manifest, and social preview assets are wired in the new app.
  4. Runtime assets load only from `apps/web-next/public`.
  5. The existing Vite app remains untouched and runnable as the reference implementation.
**Plans**: 1 plan

Plans:
- [x] 01-01: Build the parallel Next.js foundation in `apps/web-next`.

### Phase 2: Asset and Design Source-of-Truth Cleanup
**Goal**: As the NoLostDocs team, we need one clear runtime asset pipeline and a tighter design system so that the Next app can scale without visual drift or asset ambiguity.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: [ARCH-02, DS-01]
**Success Criteria** (what must be TRUE):
  1. Runtime assets have one canonical home for the Next app.
  2. Duplicate or conflicting asset usage is resolved intentionally.
  3. Shared UI primitives and tokens are tightened for reuse.
  4. The new app no longer depends on legacy runtime asset paths.
**Plans**: 1 plan

Plans:
- [x] 02-01: Centralize runtime assets and tighten the shared design surface in the Next app.

### Phase 3: Supabase, Auth, and Dashboard Port
**Goal**: As a NoLostDocs user, I need the Next app to handle signed-in access and core dashboard structure so that the production foundation becomes a real portal instead of a shell.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: [AUTH-01, DASH-01]
**Success Criteria** (what must be TRUE):
  1. The Next app supports login and session-aware routing.
  2. Protected dashboard and scan routes behave correctly when logged out.
  3. The dashboard skeleton and category structure are ported into reusable components.
  4. The Supabase browser/server split is correct and does not expose secrets.
**Plans**: 1 plan

Plans:
- [x] 03-01: Add Supabase-backed auth, protected routing, and the reusable dashboard shell in the Next app.

### Phase 4: Protected Flows Port
**Goal**: As a signed-in NoLostDocs user, I need the sensitive product flows in the Next app so that the new architecture supports the real trust model rather than just its outer shell.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: [FLOW-01, FLOW-02]
**Success Criteria** (what must be TRUE):
  1. Device lock and recovery controls are ported.
  2. Protected preview/download flows preserve the existing access model.
  3. Scan/upload and contact flows are ported with validation and user-safe error handling.
  4. Plan boundaries remain clear and enforced in the new app.
**Plans**: 1 plan

Plans:
- [x] 04-01: Port protected document actions, devices, scan/upload, and contact flows into the Next app.

### Phase 5: Parity and Verification
**Goal**: As the NoLostDocs team, we need evidence that the Next app is ready to replace the prototype so that the swap is based on verification rather than optimism.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: [VERIFY-01, VERIFY-02]
**Success Criteria** (what must be TRUE):
  1. Core homepage, auth, dashboard, and protected-flow scenarios are verified.
  2. Assets, metadata, and unfurl behavior are correct in the Next app.
  3. No browser secrets are exposed and backend assumptions remain intact.
  4. The Vite prototype is still available as a fallback/reference until the swap happens.
**Plans**: 1 plan

Plans:
- [x] 05-01: Verify the Next app across routes, metadata, assets, auth behavior, and backend-safety boundaries.

### Phase 6: Swap and Archive
**Goal**: As the NoLostDocs team, we need to promote the verified Next app into the final `apps/web` slot only when all earlier rearchitecture phases are complete, so that the production path changes safely and reversibly.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: [CUTOVER-01]
**Success Criteria** (what must be TRUE):
  1. The verified Next app replaces the active web app path.
  2. The Vite prototype is archived as `apps/web-vite-reference` or equivalent.
  3. Build and deploy paths are updated only after parity is confirmed.
  4. The repo remains runnable after the swap.
**Plans**: 0 plans

### Phase 7: Package Naming Cleanup
**Goal**: As the NoLostDocs team, we need internal package naming to match the product name after the architecture is stable, so that code and docs stop carrying obsolete branding debt.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: [NAME-01]
**Success Criteria** (what must be TRUE):
  1. Internal package names use `@nolostdocs/*`.
  2. Imports, lockfile, and docs are updated consistently.
  3. Build and verification still pass after the rename.
**Plans**: 0 plans

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Next Foundation | 1/1 | Complete | 2026-06-24 |
| 2. Asset and Design Source-of-Truth Cleanup | 1/1 | Complete | 2026-06-24 |
| 3. Supabase, Auth, and Dashboard Port | 1/1 | Complete | 2026-06-24 |
| 4. Protected Flows Port | 1/1 | Complete | 2026-06-24 |
| 5. Parity and Verification | 1/1 | Complete with blockers | 2026-06-24 |
| 6. Swap and Archive | 0/0 | Blocked on Phase 5 findings | - |
| 7. Package Naming Cleanup | 0/0 | Blocked on Phase 6 | - |
