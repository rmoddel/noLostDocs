-- Only encrypted vault-key envelopes are stored remotely. Recovery codes stay with users.
create table public.vault_recovery (
  user_id uuid primary key references auth.users(id) on delete cascade,
  vault_key_id uuid not null unique,
  encrypted_vault_key text not null check (length(encrypted_vault_key) = 64),
  recovery_iv text not null check (length(recovery_iv) = 16),
  scheme text not null default 'nld-recovery-aes-gcm-v1' check (scheme = 'nld-recovery-aes-gcm-v1'),
  created_at timestamptz not null default now()
);
alter table public.vault_recovery enable row level security;
revoke all on public.vault_recovery from anon, authenticated;
grant select, insert on public.vault_recovery to authenticated;
grant all on public.vault_recovery to service_role;
create policy vault_recovery_select_own on public.vault_recovery for select to authenticated using ((select auth.uid()) = user_id);
create policy vault_recovery_insert_own on public.vault_recovery for insert to authenticated with check ((select auth.uid()) = user_id);

alter table public.document_files drop constraint document_files_encryption_state_check;
alter table public.document_files add constraint document_files_encryption_state_check check (
  local_only
  or (encryption_version in ('client-webcrypto-aes-gcm-local-device-v1', 'client-webcrypto-aes-gcm-recovery-v2') and encrypted_file_key is not null)
  or (encryption_version = 'plaintext-v1' and encrypted_file_key is null)
);

-- Invoker privileges preserve RLS. The transaction makes setup and all legacy rewraps atomic.
create function public.initialize_vault_recovery(
  p_user_id uuid, p_vault_key_id uuid, p_encrypted_vault_key text, p_recovery_iv text, p_files jsonb
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  file_count integer;
  item jsonb;
begin
  if owner_id is null or owner_id <> p_user_id then raise exception 'Authentication changed. Sign in and retry.'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 620920));
  if exists (select 1 from public.vault_recovery where user_id = owner_id) then
    raise exception 'Recovery is already configured. Unlock with your existing recovery code.';
  end if;
  if jsonb_typeof(p_files) is distinct from 'array' then raise exception 'Invalid migration'; end if;
  perform id from public.document_files where user_id = owner_id and encryption_version = 'client-webcrypto-aes-gcm-local-device-v1' for update;
  select count(*) into file_count from public.document_files where user_id = owner_id and encryption_version = 'client-webcrypto-aes-gcm-local-device-v1';
  if file_count <> jsonb_array_length(p_files) or file_count <> (select count(distinct value->>'id') from jsonb_array_elements(p_files)) then
    raise exception 'Document list changed. Retry recovery setup from the original browser.';
  end if;
  insert into public.vault_recovery(user_id, vault_key_id, encrypted_vault_key, recovery_iv)
  values (owner_id, p_vault_key_id, p_encrypted_vault_key, p_recovery_iv);
  for item in select value from jsonb_array_elements(p_files) loop
    if item->'metadata'->>'wrapping_key_id' is distinct from p_vault_key_id::text
       or item->'metadata'->>'wrapping_key_scope' is distinct from 'recovery-code'
       or item->'metadata'->>'scheme' is distinct from 'client-webcrypto-aes-gcm-recovery-v2' then
      raise exception 'Invalid wrapped file key';
    end if;
    update public.document_files set encrypted_file_key = item->'metadata', encryption_version = 'client-webcrypto-aes-gcm-recovery-v2'
    where id = (item->>'id')::uuid and user_id = owner_id and encryption_version = 'client-webcrypto-aes-gcm-local-device-v1';
    if not found then raise exception 'Document list changed. Retry recovery setup.'; end if;
  end loop;
end;
$$;
revoke all on function public.initialize_vault_recovery(uuid,uuid,text,text,jsonb) from public, anon;
grant execute on function public.initialize_vault_recovery(uuid,uuid,text,text,jsonb) to authenticated;

-- Prevent stale browser bundles from creating unrecoverable files after recovery setup.
create function public.enforce_recoverable_file_key() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.documents d where d.id = new.document_id and d.user_id = new.user_id) then
    raise exception 'The document must belong to the file owner.';
  end if;
  if not new.local_only and (new.storage_bucket is distinct from 'user-documents' or new.storage_path is null or split_part(new.storage_path,'/',1) <> new.user_id::text or position('..' in new.storage_path) > 0) then
    raise exception 'Invalid private storage path.';
  end if;
  if new.encryption_version = 'client-webcrypto-aes-gcm-recovery-v2' then
    if not exists (select 1 from public.vault_recovery v where v.user_id = new.user_id and v.vault_key_id::text = new.encrypted_file_key->>'wrapping_key_id') then
      raise exception 'Set up recovery before saving new documents.';
    end if;
  elsif tg_op = 'INSERT' and exists (select 1 from public.vault_recovery where user_id = new.user_id) then
    raise exception 'Reload NoLostDocs and unlock recovery before saving.';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_recoverable_file_key() from public, anon, authenticated;
create trigger enforce_recoverable_file_key before insert or update on public.document_files for each row execute function public.enforce_recoverable_file_key();

create table public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  lock_token uuid,
  lock_until timestamptz,
  created_at timestamptz not null default now()
);
create table public.billing_events (
  event_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  processed_at timestamptz not null default now()
);
alter table public.billing_customers enable row level security;
alter table public.billing_events enable row level security;
revoke all on public.billing_customers, public.billing_events from anon, authenticated;
grant select on public.billing_customers to authenticated;
grant all on public.billing_customers, public.billing_events to service_role;
create policy billing_customers_select_own on public.billing_customers for select to authenticated using ((select auth.uid()) = user_id);
alter table public.subscriptions add column cancel_at_period_end boolean not null default false;
alter table public.subscriptions add column price_id text;

-- Service-only expiring lease serializes Stripe snapshot fetches and checkout creation.
create function public.claim_billing_lock(p_user_id uuid, p_token uuid) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  update public.billing_customers set lock_token = p_token, lock_until = now() + interval '90 seconds'
  where user_id = p_user_id and (lock_until is null or lock_until < now());
  return found;
end;
$$;
create function public.release_billing_lock(p_user_id uuid, p_token uuid) returns void language sql security invoker set search_path = '' as $$
  update public.billing_customers set lock_token = null, lock_until = null where user_id = p_user_id and lock_token = p_token;
$$;
create function public.apply_billing_snapshot(p_user_id uuid, p_token uuid, p_snapshot jsonb, p_event_id text default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare customer text;
begin
  select stripe_customer_id into customer from public.billing_customers where user_id = p_user_id and lock_token = p_token and lock_until > now() for update;
  if customer is null then raise exception 'Billing lock expired. Retry synchronization.'; end if;
  insert into public.subscriptions(user_id, provider, provider_customer_id, provider_subscription_id, plan, status, current_period_end, cancel_at_period_end, price_id)
  values (p_user_id, 'stripe', customer, p_snapshot->>'id', coalesce(p_snapshot->>'plan','free'), coalesce(p_snapshot->>'status','none'), (p_snapshot->>'current_period_end')::timestamptz, coalesce((p_snapshot->>'cancel_at_period_end')::boolean,false), p_snapshot->>'price_id')
  on conflict (user_id, provider) do update set provider_customer_id = excluded.provider_customer_id, provider_subscription_id = excluded.provider_subscription_id, plan = excluded.plan, status = excluded.status, current_period_end = excluded.current_period_end, cancel_at_period_end = excluded.cancel_at_period_end, price_id = excluded.price_id, updated_at = now();
  update public.profiles set plan = case when p_snapshot->>'plan' = 'premium' and p_snapshot->>'status' in ('active','trialing') then 'premium' else 'free' end,
    cloud_enabled = coalesce(p_snapshot->>'plan' = 'premium' and p_snapshot->>'status' in ('active','trialing'),false) where id = p_user_id;
  if p_event_id is not null then insert into public.billing_events(event_id,user_id) values(p_event_id,p_user_id) on conflict do nothing; end if;
end;
$$;
revoke all on function public.claim_billing_lock(uuid,uuid), public.release_billing_lock(uuid,uuid), public.apply_billing_snapshot(uuid,uuid,jsonb,text) from public, anon, authenticated;
grant execute on function public.claim_billing_lock(uuid,uuid), public.release_billing_lock(uuid,uuid), public.apply_billing_snapshot(uuid,uuid,jsonb,text) to service_role;

create table public.request_limits (key text not null, window_start timestamptz not null, count integer not null default 1, primary key(key, window_start));
create index request_limits_expiry on public.request_limits(window_start);
alter table public.request_limits enable row level security;
revoke all on public.request_limits from anon, authenticated;
grant all on public.request_limits to service_role;
create function public.consume_request_limit(p_key text, p_limit integer, p_seconds integer) returns boolean language plpgsql security invoker set search_path = '' as $$
declare window_at timestamptz; seen integer;
begin
  if p_seconds < 1 or p_limit < 1 then raise exception 'Invalid limit'; end if;
  window_at := to_timestamp(floor(extract(epoch from now()) / p_seconds) * p_seconds);
  delete from public.request_limits where window_start < now() - interval '2 days';
  insert into public.request_limits(key,window_start,count) values(p_key,window_at,1)
  on conflict(key,window_start) do update set count = public.request_limits.count + 1 returning count into seen;
  return seen <= p_limit;
end;
$$;
revoke all on function public.consume_request_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_request_limit(text,integer,integer) to service_role;

create table public.upload_reservations (path text primary key, user_id uuid not null references auth.users(id) on delete cascade, expires_at timestamptz not null default now() + interval '3 hours');
create index upload_reservations_user on public.upload_reservations(user_id,expires_at);
alter table public.upload_reservations enable row level security;
revoke all on public.upload_reservations from anon, authenticated;
grant all on public.upload_reservations to service_role;
create function public.reserve_document_upload(p_user_id uuid, p_path text, p_limit integer) returns boolean language plpgsql security invoker set search_path = '' as $$
declare objects_count integer; pending_count integer; documents_count integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 620921));
  delete from public.upload_reservations where user_id = p_user_id and expires_at < now();
  select count(*) into objects_count from storage.objects where bucket_id = 'user-documents' and split_part(name,'/',1) = p_user_id::text;
  select count(*) into pending_count from public.upload_reservations r where r.user_id = p_user_id and not exists (select 1 from storage.objects o where o.bucket_id = 'user-documents' and o.name = r.path);
  select count(*) into documents_count from public.documents where user_id = p_user_id and deleted_at is null;
  if greatest(objects_count,documents_count) + pending_count >= p_limit then return false; end if;
  insert into public.upload_reservations(path,user_id) values(p_path,p_user_id);
  return true;
end;
$$;
revoke all on function public.reserve_document_upload(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.reserve_document_upload(uuid,text,integer) to service_role;
