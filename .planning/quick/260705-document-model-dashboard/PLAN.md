---
title: Revamp NoLostDocs document hierarchy and dashboard organization
status: in_progress
created: 2026-07-05
---

# Goal
Rework the document metadata model and dashboard organization flow so NoLostDocs can support owner/profile filtering, stable categories, document types, searchable document metadata, and a cleaner dashboard experience without broad refactors.

# Required Schema
The phase must define and implement a central document metadata model, not just blob/file tracking.

## Documents Table
`documents` must store document metadata directly, including:

- `id`
- `user_id`
- `owner_profile_id`
- `category_id`
- `document_type_id`
- `title`
- `status`
- `issue_date` nullable
- `expiration_date` nullable
- `document_date` nullable
- `notes` nullable
- `tags` nullable as `text[]` or `jsonb`
- `created_at`
- `updated_at`

## Document Files Table
`document_files` must remain a separate blob/file table linked to `documents`.

## Lookup Tables
- `document_profiles` for owner/entity filtering.
- `document_categories` for the six fixed dashboard categories.
- `document_types` for category-scoped and user-scoped document types.

# Scope Order
1. Schema changes
2. UI web changes
3. UI mobile changes
4. Everything else
5. Marketing changes

# Phase 1: Schema Changes
Deliver the database foundation first so every later UI and flow change can depend on a stable model.

## Work
- Add `document_profiles` for owner/entity records (`Me`, `Spouse`, `Child 1`, `Family`, `Business`, etc.).
- Add `document_categories` as the six-system-category lookup table.
- Expand `document_types` so types are category-scoped, user-scoped when custom, and seeded separately from document records.
- Expand `documents` to store owner profile, category, type, title, status, dates, notes, and tags.
- Expand `document_files` to store file role and filename/content metadata while keeping blob storage separate from document metadata.
- Add the minimal supporting indexes, constraints, and updated-at triggers needed for the new joins and filters.
- Add migration-time backfill or compatibility logic so existing uploads do not break during rollout.

## Verification
- Confirm the new tables and columns exist.
- Confirm the default owner profile is created for a new user.
- Confirm seeded categories and types are readable under RLS.
- Confirm the existing upload flow can still create a document plus file record without violating constraints.

# Phase 2: UI Web Changes
Update the dashboard web experience to use the new hierarchy and to present the document vault as a structured home screen, not a scanner landing page.

## UI/UX
- Show the account identity area and search first.
- Show owner/profile filter chips for `Me`, `Spouse`, `Child 1`, `Child 2`, `Family`, and `Business` equivalents.
- Show only the six high-level category buttons on the dashboard.
- Show recent document rows/cards with owner, category, type, status, and updated info.
- Keep scan available as a secondary action, not the dominant hero on the dashboard.
- Keep the dashboard feeling like a document home screen, not a scanner landing page.

## Work
- Replace prototype category/type assumptions with queries against the new schema.
- Add owner/profile filter chips to the dashboard.
- Add category buttons for only the six product categories.
- Add document type awareness to search and filtering.
- Update recent document rows/cards to show category, owner, type, status, and file state cleanly.
- Keep scan available, but remove the oversized dashboard scan hero so the actual dashboard priority is account identity, search, filters, categories, and recent documents.

## Verification
- Confirm dashboard filtering works by owner, category, document type, and search text.
- Confirm the home screen still shows a clear primary scan action in the existing bottom-nav or equivalent entry point.
- Confirm the dashboard does not rely on the old prototype taxonomy as the source of truth.

# Phase 3: UI Mobile Changes
Apply the smallest possible mobile-specific adjustment that matches the new dashboard priorities.

## UI/UX
- Remove the large top `Scan Docs` hero card from the mobile dashboard.
- Keep the center bottom scan button as the primary scan entry point.
- Prioritize account identity, search, owner filters, categories, and recent documents above the fold.
- Preserve scan access without over-emphasizing it.

## Work
- Remove the large top "Scan Docs" hero from the mobile dashboard home.
- Keep the center bottom scan action as the primary scan entry point.
- Preserve document browsing, owner chips, category cards, and recent docs as the main mobile dashboard content.

## Verification
- Confirm mobile layout still renders the home/dashboard flow without pushing categories below the fold unnecessarily.
- Confirm scan remains available from the bottom navigation and is not hidden.

# Phase 4: Everything Else
Close the remaining product and backend gaps that the schema and UI changes expose.

## Work
- Update shared TypeScript types for the new document metadata model.
- Update document upload and download flows to write and read the new model fields.
- Update any server-side queries, RLS policy assumptions, and storage access checks that depend on the old simpler shape.
- Add seed data for categories, system types, and any bootstrap logic needed for default owner profiles.
- Update any dashboard or scan helpers that still infer category from the old taxonomy JSON.
- Add tests or smoke checks for the new query shape and upload path.

## Verification
- Confirm uploads still land in the private bucket and create the correct document/file rows.
- Confirm document retrieval still uses signed access where required.
- Confirm RLS blocks cross-user reads and writes.

# Phase 5: Marketing Changes
Treat marketing content as a follow-on cleanup, not a dependency for the product model rollout.

## Work
- Update any marketing or product-language references that still describe the old dashboard organization.
- Keep product honesty intact and avoid wallet language or claims that imply official document equivalence.
- Align public copy with the new owner/category/type vocabulary once the product model is stable.

## Verification
- Confirm marketing copy matches the new terminology.
- Confirm no web copy reintroduces the old taxonomy or scanner-first framing.

# Execution Notes
- Do not broaden scope into mobile app work outside the dashboard change above.
- Do not touch Doc Brain in this phase.
- Prefer additive migrations and compatibility shims before removal of legacy assumptions.
- Keep schema, UI, and seed changes tightly coupled so the dashboard can ship against the new hierarchy without a second refactor.
