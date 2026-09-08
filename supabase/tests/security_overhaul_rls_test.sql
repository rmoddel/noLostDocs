BEGIN;
SELECT plan(11);

SELECT ok(
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
  'authenticated users can update allowed profile fields'
);

SELECT ok(
  NOT has_column_privilege('authenticated', 'public.profiles', 'plan', 'UPDATE'),
  'authenticated users cannot update profile plan'
);

SELECT ok(
  NOT has_column_privilege('authenticated', 'public.profiles', 'cloud_enabled', 'UPDATE'),
  'authenticated users cannot update profile cloud_enabled'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.profiles', 'SELECT'),
  'anon cannot select profiles'
);

SELECT ok(
  has_table_privilege('authenticated', 'public.audit_events', 'SELECT'),
  'authenticated users can read their own audit events through RLS'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.audit_events', 'INSERT'),
  'authenticated users cannot directly insert audit events'
);

SELECT ok(
  has_table_privilege('authenticated', 'public.subscriptions', 'SELECT'),
  'authenticated users can read their own subscription rows through RLS'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.subscriptions', 'UPDATE'),
  'authenticated users cannot mutate subscription rows'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'document_types'
      AND indexname = 'document_types_slug_scope_unique_idx'
  ),
  'document_types has null-aware scoped slug uniqueness'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_files_encryption_state_check'
      AND conrelid = 'public.document_files'::regclass
  ),
  'document_files enforces encryption metadata consistency'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname IN (
        'storage_select_own_folder',
        'storage_insert_own_folder',
        'storage_update_own_folder',
        'storage_delete_own_folder'
      )
  ),
  'sensitive document storage access is not exposed through direct client policies'
);

SELECT * FROM finish();
ROLLBACK;
