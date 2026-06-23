-- Bucket creation is often applied through Supabase-managed storage metadata.
-- Keep the intended state documented in code and apply via CLI/dashboard when connected.

insert into storage.buckets (id, name, public)
values ('user-documents', 'user-documents', false)
on conflict (id) do nothing;

create policy "storage_select_own_folder"
on storage.objects
for select
to authenticated
using (bucket_id = 'user-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "storage_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'user-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "storage_update_own_folder"
on storage.objects
for update
to authenticated
using (bucket_id = 'user-documents' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'user-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "storage_delete_own_folder"
on storage.objects
for delete
to authenticated
using (bucket_id = 'user-documents' and (storage.foldername(name))[1] = auth.uid()::text);
