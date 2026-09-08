-- Security hardening for the September 2026 priority review.
-- Keep billing authority, audit writes, and plan limits backend-owned.

alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.document_profiles enable row level security;
alter table public.document_categories enable row level security;
alter table public.document_types enable row level security;
alter table public.documents enable row level security;
alter table public.document_files enable row level security;
alter table public.document_shares enable row level security;
alter table public.audit_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.contact_requests enable row level security;

revoke all on table
  public.profiles,
  public.devices,
  public.categories,
  public.document_profiles,
  public.document_categories,
  public.document_types,
  public.documents,
  public.document_files,
  public.document_shares,
  public.audit_events,
  public.subscriptions,
  public.contact_requests
from anon, authenticated;

grant select on table public.profiles to authenticated;
grant insert (id, full_name, email) on table public.profiles to authenticated;
grant update (full_name, email, updated_at) on table public.profiles to authenticated;

grant select on table public.devices to authenticated;

grant select on table public.categories to authenticated;
grant select, insert, update, delete on table public.document_profiles to authenticated;
grant select on table public.document_categories to authenticated;
grant select, insert, update, delete on table public.document_types to authenticated;
grant select, insert, update, delete on table public.documents to authenticated;
grant select, insert, update, delete on table public.document_files to authenticated;
grant select, insert, update, delete on table public.document_shares to authenticated;
grant select on table public.audit_events to authenticated;
grant select on table public.subscriptions to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function public.prevent_profile_billing_field_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select auth.uid()) = new.id
    and (
      new.plan is distinct from old.plan
      or new.cloud_enabled is distinct from old.cloud_enabled
    )
  then
    raise exception 'Billing fields are backend-owned.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_billing_field_update on public.profiles;
create trigger prevent_profile_billing_field_update
before update on public.profiles
for each row execute function public.prevent_profile_billing_field_update();

revoke all on function public.prevent_profile_billing_field_update() from public, anon, authenticated;
revoke all on function public.create_default_document_profile() from public, anon, authenticated;

alter table public.document_types
  drop constraint if exists document_types_slug_scope_unique;

drop index if exists public.document_types_slug_scope_unique_idx;
create unique index document_types_slug_scope_unique_idx
on public.document_types (category_id, user_id, slug) nulls not distinct;

update public.document_files
set encryption_version = 'plaintext-v1'
where encrypted_file_key is null
  and encryption_version = 'v1';

alter table public.document_files
  alter column encryption_version set default 'plaintext-v1';

alter table public.document_files
  drop constraint if exists document_files_encryption_state_check;

alter table public.document_files
  add constraint document_files_encryption_state_check
  check (
    local_only
    or (
      encryption_version = 'client-webcrypto-aes-gcm-local-device-v1'
      and encrypted_file_key is not null
    )
    or (
      encryption_version = 'plaintext-v1'
      and encrypted_file_key is null
    )
  );

drop policy if exists "storage_select_own_folder" on storage.objects;
drop policy if exists "storage_insert_own_folder" on storage.objects;
drop policy if exists "storage_update_own_folder" on storage.objects;
drop policy if exists "storage_delete_own_folder" on storage.objects;

create or replace function public.resolve_document_limit_for_user(target_user_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1
      from public.subscriptions s
      where s.user_id = target_user_id
        and s.plan = 'premium'
        and s.status in ('active', 'trialing')
    )
    then 50
    else 3
  end;
$$;

create or replace function public.enforce_document_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_limit integer;
  current_count integer;
begin
  if new.deleted_at is not null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  select public.resolve_document_limit_for_user(new.user_id)
  into allowed_limit;

  select count(*)
  into current_count
  from public.documents d
  where d.user_id = new.user_id
    and d.deleted_at is null;

  if current_count >= allowed_limit then
    raise exception 'Document limit reached for current plan.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_document_limit_before_insert on public.documents;
create trigger enforce_document_limit_before_insert
before insert on public.documents
for each row execute function public.enforce_document_limit();

revoke all on function public.resolve_document_limit_for_user(uuid) from public, anon, authenticated;
revoke all on function public.enforce_document_limit() from public, anon, authenticated;
