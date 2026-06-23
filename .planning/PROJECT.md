# NoLostDocs

## What This Is

NoLostDocs is a secure document vault for storing, organizing, and recovering sensitive personal and professional documents without panic, clutter, or guesswork. The immediate product objective is web-first: shape the brand, product language, trust model, portal experience, and cloud-backed document flows on the web before resuming dedicated mobile work.

## Core Value

No more lost docs. Everything the user needs in one app.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Deliver a serious web-first NoLostDocs experience that explains the product, trust model, and local-vs-cloud behavior with premium product quality.
- [ ] Provide a web portal for cloud users to manage devices, recover access, and view cloud-backed documents.
- [ ] Offer an explicit premium cloud mode with encrypted backup, restore, multi-device access, and remote lock for lost devices.
- [ ] Enforce security-first backend foundations: strict RLS, private storage, client-side encryption, and auditability.
- [ ] Keep product messaging honest: secure document vault and recovery tool, not a legal replacement for official originals.

### Out of Scope

- Claiming scanned documents are universally accepted as legal replacements — the product must not mislead users.
- Claiming HIPAA compliance before legal review, vendor agreements, and operational controls exist — architecture can prepare for it, marketing cannot.
- Native app expansion in the immediate cycle — web is the only active surface until the product language, flows, and architecture settle.
- Shipping OCR, family sharing, or emergency access in the initial MVP — core storage, restore, and remote lock come first.
- Building custom infrastructure around EC2-hosted Postgres for MVP — managed Supabase is the chosen baseline to reduce avoidable operational risk.

## Context

The product is security-sensitive and now intentionally web-first. The short-term goal is not to finish every surface at once; it is to make the website and future portal feel premium, trustworthy, and unmistakably aligned with the real product promise. The longer-term plan still includes native clients, but current execution should optimize for the web experience, Supabase-backed auth/data architecture, and cloud-enabled recovery flows. Latest-doc review notes: Supabase client configuration should use publishable-key naming for browser-side work, and the current flagship implementation is the Vite-based web shell while any later Next.js migration remains a separate architectural decision.

## Constraints

- **Security**: Never store raw sensitive files unencrypted — the app handles identity, medical, vehicle, and business records.
- **Product honesty**: Do not imply legal equivalence to physical IDs or official originals — acceptance varies by institution.
- **Architecture**: Cloud-backed web access must stay explicit; local-only behavior cannot be implied to exist on web.
- **Platform**: Web-only for the current cycle — mobile work is paused until the website and portal direction are right.
- **Naming**: Use `NoLostDocs` in the product and avoid “wallet” language on the frontend.
- **Stack**: The active implementation surface is Vite + React + TypeScript; any future portal migration must not interrupt the current web-first execution path.
- **Compliance posture**: Build toward HIPAA-grade patterns without marketing HIPAA compliance — legal and vendor review are deferred.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Supabase as the initial backend core | Managed Postgres/Auth/Storage/RLS reduces MVP operational risk and speeds delivery | — Pending |
| Rename the product to NoLostDocs | The name is more direct, memorable, and aligned with the user problem being solved | — Pending |
| Go web-only for the current cycle | It is the fastest way to lock product language, portal structure, and trust presentation before splitting effort across native apps | — Pending |
| Separate local-only and cloud-backed modes clearly in all copy and UX | Users need a clear privacy/recovery tradeoff, and the architecture changes materially between modes | — Pending |
| Keep encrypted file handling client-side before local or cloud persistence | Reduces blast radius if storage or backend access controls fail | — Pending |
| Delay OCR and advanced sharing until storage, restore, and remote lock are proven | Prevents premature scope growth in the highest-risk security surface | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-19 after Phase 1 doc alignment for web-first execution*
