# Roadmap: NoLostDocs

## Overview

NoLostDocs now moves through a web-first execution path. The immediate sequence is brand and trust clarity, portal structure, secure account and device foundations, cloud-backed document visibility, premium plan enforcement, and then production hardening before native surfaces resume.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Brand, Positioning, and Web Experience** - Make the website feel premium, trustworthy, and unmistakably clear about what NoLostDocs is and is not.
- [x] **Phase 2: Portal Information Architecture** - Deliver the core web portal structure for categories, document states, and cloud-only expectations.
- [x] **Phase 3: Auth, Devices, and Recovery Controls** - Add account access, trusted devices, and lost-device control flows.
- [x] **Phase 4: Cloud Document Dashboard** - Show real cloud-backed document metadata, status, and secure access patterns.
- [x] **Phase 5: Premium Access and Billing Surface** - Make free versus premium boundaries and billing behavior coherent on the web.
- [ ] **Phase 6: Hardening and Launch Readiness** - Verify security promises, trust language, and production readiness before mobile resumes.

## Phase Details

### Phase 1: Brand, Positioning, and Web Experience
**Goal**: As a person evaluating a secure document vault, I want to experience a premium NoLostDocs website that clearly explains what the product is and how cloud-backed access works, so that I can quickly decide whether it solves my document-access problem.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: [BRND-01, BRND-02, BRND-03, WEB-01, WEB-03, WEB-04]
**Success Criteria** (what must be TRUE):
  1. The website clearly communicates that NoLostDocs is a secure document vault, not a legal replacement for originals.
  2. The homepage feels intentional, premium, and memorable rather than like a placeholder dashboard.
  3. Local-only versus cloud-backed behavior is explained without ambiguity.
  4. The active frontend naming is NoLostDocs everywhere user-facing.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Rename the project and realign planning artifacts for web-only execution.
- [ ] 01-02: Rebuild the web experience and product copy around NoLostDocs.
- [ ] 01-03: Align client config and frontend messaging with current docs and trust constraints.

### Phase 2: Portal Information Architecture
**Goal**: As a cloud-backed NoLostDocs user, I want to use a clear portal shell for categories, statuses, and access expectations, so that I can understand where my documents live before deeper account features arrive.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: [WEB-02, PORT-02, PLAN-01]
**Success Criteria** (what must be TRUE):
  1. Users can understand how categories, document statuses, and cloud-backed access work from the web portal.
  2. The portal shell has a clear dashboard, category, device, and security navigation model.
  3. The UI reinforces that web access is for cloud-backed users only.
  4. The design system is strong enough to carry into auth and dashboard work.
**Plans**: 3 plans

Plans:
- [x] 02-01: Build the portal navigation and account shell.
- [x] 02-02: Implement category and document-status views.
- [x] 02-03: Add cloud-only messaging, search entry points, and upgrade framing.

### Phase 3: Auth, Devices, and Recovery Controls
**Goal**: As a cloud-enabled NoLostDocs user, I want to have secure sign-in, trusted-device visibility, and lost-device controls, so that I can protect my account when a device is shared, lost, or stolen.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: [PORT-01, PORT-03, PORT-04, SECU-02]
**Success Criteria** (what must be TRUE):
  1. Cloud-enabled users can log in securely to the portal.
  2. Trusted devices and last-seen data are visible and understandable.
  3. A lost device can be marked and remotely locked from the web.
  4. Web security messaging reflects shared-device and recovery risks honestly.
**Plans**: 3 plans

Plans:
- [x] 03-01: Add auth shell and secure session handling.
- [x] 03-02: Implement devices view and remote-lock interactions.
- [x] 03-03: Connect account security and recovery UX.

### Phase 4: Cloud Document Dashboard
**Goal**: As a cloud-backed NoLostDocs user, I want to browse my document metadata and understand secure access patterns from the portal, so that I can find what I need without guessing what the web surface can and cannot do.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: [PORT-02, SECU-01]
**Success Criteria** (what must be TRUE):
  1. Users can inspect cloud-backed categories and document listings from the web.
  2. The portal distinguishes metadata browsing from secure file access.
  3. Download and preview actions are framed as authorized, short-lived operations.
  4. Document status, expiration, and completeness are visually obvious.
**Plans**: 3 plans

Plans:
- [x] 04-01: Wire dashboard data and category listings.
- [x] 04-02: Add secure document detail and preview/download states.
- [x] 04-03: Reinforce access control and audit-aware UI flows.

### Phase 5: Plan Enforcement & Premium Access
**Goal**: As a NoLostDocs account owner, I want to have premium access boundaries and billing state enforced consistently, so that web access, backup, and recovery features match the plan I actually have.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: [PLAN-01, PLAN-02, PLAN-03]
**Success Criteria** (what must be TRUE):
  1. Free users keep a useful local-only mobile experience without accidental cloud access.
  2. Premium status unlocks cloud backup, web access, and restore features consistently.
  3. Storage or document limits are enforced on the backend rather than just hidden in the UI.
  4. Billing and subscription state can be reasoned about before launch, even if UI remains minimal.
**Plans**: 2 plans

Plans:
- [x] 05-01: Add subscriptions schema, Stripe webhook flow, and plan state sync.
- [x] 05-02: Enforce plan-based feature access, quotas, and upgrade messaging across web and mobile.

### Phase 6: Hardening, Audit, and Beta Readiness
**Goal**: As the NoLostDocs team preparing for beta, I want to verify the platform's security promises, auditability, and abuse protections, so that we can launch with evidence instead of assumptions.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: [SECU-02, SECU-03, SECU-04, SECU-05]
**Success Criteria** (what must be TRUE):
  1. Locked devices cannot sync or fetch cloud documents until re-authorized.
  2. Sensitive actions are captured in audit events with enough detail for incident review.
  3. Private storage access uses short-lived authorized downloads only.
  4. RLS, storage isolation, and backup/restore behaviors are tested against cross-user abuse cases.
**Plans**: 3 plans

Plans:
- [ ] 06-01: Add audit logging, signed access helpers, and lost-device session cleanup.
- [ ] 06-02: Write RLS, storage-policy, and restore-path verification tests.
- [ ] 06-03: Close launch gaps, document beta-readiness checks, and prepare Android beta release.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Brand, Positioning, and Web Experience | 3/3 | Complete | 2026-06-19 |
| 2. Portal Information Architecture | 3/3 | Complete | 2026-06-19 |
| 3. Auth, Devices, and Recovery Controls | 3/3 | Complete | 2026-06-19 |
| 4. Cloud Document Dashboard | 3/3 | Complete | 2026-06-23 |
| 5. Plan Enforcement & Premium Access | 2/2 | Complete | 2026-06-23 |
| 6. Hardening, Audit, and Beta Readiness | 0/3 | Not started | - |
