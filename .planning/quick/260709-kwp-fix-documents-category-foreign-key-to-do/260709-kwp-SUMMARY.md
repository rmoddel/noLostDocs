---
status: complete
quick_id: 260709-kwp
date: 2026-07-09
---

# Quick Task 260709-kwp Summary

## Root Cause

`documents.category_id` still had the original `documents_category_id_fkey` pointing at `public.categories(id)`, but the dashboard and scan flow now use `public.document_categories(id)`.

## Fix

Added migration `supabase/migrations/20260709190337_fix_documents_category_fk.sql` to:

- Drop the stale `documents_category_id_fkey`.
- Normalize existing invalid `documents.category_id` values using `document_types.category_id` first, then metadata/category fallback.
- Recreate `documents_category_id_fkey` against `public.document_categories(id)`.

## Verification

- `npm run typecheck -w @nolostdocs/web` passed.
- `npm run build:web` passed.

## Follow-Up

Apply the new migration to the live Supabase project before retrying scan save in production.
