alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.categories enable row level security;
alter table public.documents enable row level security;
alter table public.document_files enable row level security;
alter table public.document_shares enable row level security;
alter table public.audit_events enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "devices_select_own" on public.devices;
create policy "devices_select_own"
on public.devices
for select
using (user_id = auth.uid());

drop policy if exists "devices_insert_own" on public.devices;
create policy "devices_insert_own"
on public.devices
for insert
with check (user_id = auth.uid());

drop policy if exists "devices_update_own" on public.devices;
create policy "devices_update_own"
on public.devices
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "categories_select_own_or_system" on public.categories;
create policy "categories_select_own_or_system"
on public.categories
for select
using (user_id = auth.uid() or user_id is null);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own"
on public.categories
for insert
with check (user_id = auth.uid());

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own"
on public.categories
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own"
on public.documents
for select
using (user_id = auth.uid());

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
on public.documents
for insert
with check (user_id = auth.uid());

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own"
on public.documents
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own"
on public.documents
for delete
using (user_id = auth.uid());

drop policy if exists "document_files_select_own" on public.document_files;
create policy "document_files_select_own"
on public.document_files
for select
using (user_id = auth.uid());

drop policy if exists "document_files_insert_own" on public.document_files;
create policy "document_files_insert_own"
on public.document_files
for insert
with check (user_id = auth.uid());

drop policy if exists "document_files_update_own" on public.document_files;
create policy "document_files_update_own"
on public.document_files
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "document_shares_select_owner_or_recipient" on public.document_shares;
create policy "document_shares_select_owner_or_recipient"
on public.document_shares
for select
using (owner_user_id = auth.uid() or recipient_user_id = auth.uid());

drop policy if exists "document_shares_insert_owner" on public.document_shares;
create policy "document_shares_insert_owner"
on public.document_shares
for insert
with check (owner_user_id = auth.uid());

drop policy if exists "document_shares_update_owner" on public.document_shares;
create policy "document_shares_update_owner"
on public.document_shares
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "audit_events_select_own" on public.audit_events;
create policy "audit_events_select_own"
on public.audit_events
for select
using (user_id = auth.uid());

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions
for select
using (user_id = auth.uid());
