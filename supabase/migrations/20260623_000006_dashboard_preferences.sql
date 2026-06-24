create table if not exists public.dashboard_category_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_key text not null,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, category_key)
);

alter table public.dashboard_category_preferences enable row level security;

create policy "dashboard_category_preferences_select_own"
on public.dashboard_category_preferences
for select
using (user_id = auth.uid());

create policy "dashboard_category_preferences_insert_own"
on public.dashboard_category_preferences
for insert
with check (user_id = auth.uid());

create policy "dashboard_category_preferences_update_own"
on public.dashboard_category_preferences
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop trigger if exists set_dashboard_category_preferences_updated_at on public.dashboard_category_preferences;
create trigger set_dashboard_category_preferences_updated_at
before update on public.dashboard_category_preferences
for each row execute function public.set_updated_at();
