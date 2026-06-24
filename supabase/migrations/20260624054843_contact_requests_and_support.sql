create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  source_route text not null default '/',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint contact_requests_name_length check (char_length(name) between 1 and 120),
  constraint contact_requests_email_length check (char_length(email) between 3 and 320),
  constraint contact_requests_subject_length check (char_length(subject) between 1 and 160),
  constraint contact_requests_message_length check (char_length(message) between 1 and 5000),
  constraint contact_requests_source_route_length check (char_length(source_route) between 1 and 32)
);

alter table public.contact_requests enable row level security;

create index if not exists contact_requests_created_at_idx on public.contact_requests (created_at desc);
create index if not exists contact_requests_status_created_at_idx on public.contact_requests (status, created_at desc);
