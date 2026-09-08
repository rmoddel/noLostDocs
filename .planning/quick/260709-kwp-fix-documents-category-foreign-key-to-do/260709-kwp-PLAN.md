# Quick Task 260709-kwp: Fix Documents Category Foreign Key

Date: 2026-07-09

## Goal

Fix scan saves failing with `documents_category_id_fkey` because `documents.category_id` still references legacy `public.categories(id)` while the dashboard uses `public.document_categories(id)`.

## Tasks

1. Add a migration that drops the old `documents.category_id` foreign key and re-adds it against `public.document_categories(id)`.
2. Verify the app still typechecks and builds.
3. Record the outcome and note that the migration must be applied to the live Supabase project.
