---
phase: 01
slug: brand-positioning-and-web-experience
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-19
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser app to Supabase public client | The website bootstraps a browser-safe Supabase client using URL + publishable key only. | Public client configuration, session tokens in future authenticated flows |
| Product marketing to user trust expectations | Homepage and portal preview communicate what NoLostDocs is and is not allowed to claim. | User understanding of legal acceptance, cloud access, and recovery scope |
| Repo setup docs to operator configuration | README and env examples teach how to connect a real Supabase project later. | Placeholder env values, browser-safe keys, server-only secret boundaries |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-01-01 | Spoofing / Elevation | Web client configuration | mitigate | `packages/supabase/src/index.ts`, `packages/config/src/index.ts`, `apps/web/.env.local.example`, and repo docs explicitly constrain browser usage to Supabase URL + publishable key and warn against service-role credentials in Vite env files. | closed |
| T-01-02 | Tampering / Information Disclosure | Product trust messaging | mitigate | `apps/web/src/App.tsx` states that scanned copies are not legal replacements and that web access is for cloud-backed accounts only, reducing the chance of unsafe user assumptions. | closed |
| T-01-03 | Repudiation / Misconfiguration | Setup documentation | mitigate | `README.md` and `supabase/README.md` document placeholder-only checked-in values and separate client-safe configuration from operator-only secrets. | closed |
| T-01-04 | Information Disclosure | Static prototype content | accept | The website ships synthetic placeholder document/category data from `packages/config/src/index.ts`. No real personal data or secrets are embedded, so the residual risk is limited to mock-content misunderstanding. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-01-01 | T-01-04 | Static prototype content is intentionally shipped for UX scaffolding. The content is synthetic, non-secret, and will be replaced by real cloud-backed flows in later phases. | Codex security review | 2026-06-19 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-19 | 4 | 4 | 0 | Codex (`gsd-secure-phase`) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-19
