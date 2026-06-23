# Requirements: NoLostDocs

**Defined:** 2026-06-18
**Core Value:** No more lost docs. Everything the user needs in one app.

## v1 Requirements

### Brand & Positioning

- [ ] **BRND-01**: Website uses the product name NoLostDocs consistently in user-facing copy.
- [ ] **BRND-02**: Website clearly explains that NoLostDocs is a secure document vault, not a legal replacement for official originals.
- [ ] **BRND-03**: Website communicates the tagline “No more lost docs. Everything you need in one app.”

### Web Experience

- [ ] **WEB-01**: Website presents a premium web-first experience that feels intentional, modern, and trustworthy.
- [ ] **WEB-02**: Website shows the major document categories and status model in a way normal users understand immediately.
- [ ] **WEB-03**: Website clearly distinguishes local-only behavior from cloud-backed portal access.
- [ ] **WEB-04**: Website explains the main use cases for the product, including emergencies, onboarding, travel, medical visits, and compliance.

### Portal Foundation

- [ ] **PORT-01**: Cloud-enabled user can log in to a web portal to manage account access.
- [ ] **PORT-02**: Cloud-enabled user can view cloud-backed categories and document metadata from the web portal.
- [ ] **PORT-03**: Cloud-enabled user can see trusted devices with last-seen status.
- [ ] **PORT-04**: Cloud-enabled user can mark a device as lost and remotely lock it.

### Premium Access

- [ ] **PLAN-01**: Website makes it clear that web access requires cloud backup.
- [ ] **PLAN-02**: Premium users unlock cloud backup, restore, multi-device sync, and web access.
- [ ] **PLAN-03**: Plan-based access and storage/document limits are enforced server-side.

### Security & Operations

- [ ] **SECU-01**: Cloud document access uses private buckets and short-lived authorized downloads only.
- [ ] **SECU-02**: A locked device cannot sync, download, or restore cloud-backed documents until re-authorized.
- [ ] **SECU-03**: Sensitive actions such as uploads, downloads, device registration, and remote lock events are recorded in audit events.
- [ ] **SECU-04**: Access controls are verified so one user cannot read or modify another user's documents or storage paths.
- [ ] **SECU-05**: Browser-side configuration uses safe public client credentials only and never service-role credentials.

## v2 Requirements

### Native Apps

- **MOBL-01**: User can choose between local-only mode and cloud backup mode during mobile onboarding.
- **MOBL-02**: User can set app PIN and enable biometric unlock.
- **MOBL-03**: User can scan, import, organize, and store documents on-device.
- **MOBL-04**: Local-only mode never uploads documents.

### OCR & Search

- **OCR-01**: User can search document contents using OCR-extracted text.
- **OCR-02**: User can choose whether OCR processing happens locally or in the cloud when that tradeoff is introduced.
- **OCR-03**: User sees privacy messaging when enabling any cloud OCR flow.

### Professional Workflows

- **PROF-01**: User can use professional templates for licenses, certifications, and compliance documents.
- **PROF-02**: User can track professional document status with reminders and checklist-style progress.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Legal replacement claims for IDs, passports, registrations, or insurance cards | Product positioning must stay honest and avoid regulatory misrepresentation |
| HIPAA compliance marketing in MVP | Requires legal, operational, and vendor readiness beyond initial build scope |
| Mobile-first execution in the current cycle | Web-only focus is the active delivery strategy for now |
| OCR-powered full-text search in MVP | Adds privacy and processing complexity before core storage/restore is stable |
| Family sharing in MVP | Not essential to prove the main secure document vault value proposition |
| Web access for local-only users | Web access is intentionally tied to cloud-backed mode |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRND-01 | Phase 1 | Pending |
| BRND-02 | Phase 1 | Pending |
| BRND-03 | Phase 1 | Pending |
| WEB-01 | Phase 1 | Pending |
| WEB-02 | Phase 1 | Pending |
| WEB-03 | Phase 1 | Pending |
| WEB-04 | Phase 1 | Pending |
| PORT-01 | Phase 3 | Pending |
| PORT-02 | Phase 4 | Pending |
| PORT-03 | Phase 3 | Pending |
| PORT-04 | Phase 3 | Pending |
| PLAN-01 | Phase 5 | Pending |
| PLAN-02 | Phase 5 | Pending |
| PLAN-03 | Phase 5 | Pending |
| SECU-01 | Phase 4 | Pending |
| SECU-02 | Phase 3 | Pending |
| SECU-03 | Phase 6 | Pending |
| SECU-04 | Phase 6 | Pending |
| SECU-05 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-18*
*Last updated: 2026-06-18 after NoLostDocs web-only re-initiation*
