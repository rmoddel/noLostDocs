create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  plan text not null default 'free',
  cloud_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_name text,
  platform text not null,
  device_fingerprint text,
  is_trusted boolean not null default false,
  is_locked boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete cascade,
  name text not null,
  icon text,
  sort_order integer not null default 0,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.document_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_category text,
  required_fields jsonb not null default '{}'::jsonb,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  document_type_id uuid references public.document_types(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'active',
  issue_date date,
  expiration_date date,
  metadata jsonb not null default '{}'::jsonb,
  encrypted_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.document_files (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text,
  storage_path text,
  local_only boolean not null default false,
  mime_type text,
  size_bytes bigint,
  checksum text,
  encryption_version text not null default 'v1',
  encrypted_file_key jsonb,
  page_count integer,
  created_at timestamptz not null default now()
);

create table if not exists public.document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  recipient_email text,
  permission text not null default 'view',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
