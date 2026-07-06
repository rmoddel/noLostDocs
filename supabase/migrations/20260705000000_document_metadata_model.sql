create table if not exists public.document_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  profile_type text not null check (profile_type in ('person', 'family', 'business', 'other')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.document_categories (name, slug, description, sort_order, is_system)
values
  ('Personal & Family', 'personal-family', 'Identity and household records', 1, true),
  ('Health', 'health', 'Medical and insurance records', 2, true),
  ('Home & Car', 'home-car', 'Property, vehicle, and maintenance records', 3, true),
  ('Money & Legal', 'money-legal', 'Finance, tax, and legal documents', 4, true),
  ('Work & Business', 'work-business', 'Employment and business records', 5, true),
  ('Travel & Emergency', 'travel-emergency', 'Travel and urgent backup records', 6, true)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_system = excluded.is_system,
    updated_at = now();

alter table public.document_types
  add column if not exists category_id uuid references public.document_categories(id) on delete set null,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists slug text,
  add column if not exists is_custom boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

alter table public.documents
  add column if not exists owner_profile_id uuid references public.document_profiles(id) on delete set null,
  add column if not exists document_date date,
  add column if not exists notes text,
  add column if not exists tags text[];

alter table public.document_files
  add column if not exists original_filename text,
  add column if not exists content_type text,
  add column if not exists file_role text not null default 'original' check (file_role in ('original', 'preview', 'processed'));

insert into public.document_types (category_id, user_id, name, slug, is_system, is_custom)
select c.id, null, v.name, v.slug, true, false
from public.document_categories c
join (
  values
    ('personal-family', 'Driver''s License / ID', 'drivers-license-id'),
    ('personal-family', 'Passport', 'passport-personal'),
    ('personal-family', 'Birth Certificate', 'birth-certificate'),
    ('personal-family', 'Social Security Card', 'social-security-card'),
    ('personal-family', 'Marriage Certificate', 'marriage-certificate'),
    ('personal-family', 'School Form', 'school-form'),
    ('personal-family', 'Camp Form', 'camp-form'),
    ('personal-family', 'Family Record', 'family-record'),
    ('health', 'Health Insurance Card', 'health-insurance-card'),
    ('health', 'Medicaid / Medicare Card', 'medicaid-medicare-card'),
    ('health', 'Prescription Card', 'prescription-card'),
    ('health', 'Medication List', 'medication-list'),
    ('health', 'Doctor Record', 'doctor-record'),
    ('health', 'Lab Result', 'lab-result'),
    ('health', 'Immunization Record', 'immunization-record'),
    ('health', 'Dental / Vision Card', 'dental-vision-card'),
    ('health', 'Medical Clearance Form', 'medical-clearance-form'),
    ('home-car', 'Car Registration', 'car-registration'),
    ('home-car', 'Car Insurance Card', 'car-insurance-card'),
    ('home-car', 'Inspection', 'inspection'),
    ('home-car', 'Car Title', 'car-title'),
    ('home-car', 'Lease / Mortgage Document', 'lease-mortgage-document'),
    ('home-car', 'Property Deed', 'property-deed'),
    ('home-car', 'Utility Bill', 'utility-bill'),
    ('home-car', 'Home Insurance', 'home-insurance'),
    ('home-car', 'Warranty', 'warranty'),
    ('home-car', 'Repair Record', 'repair-record'),
    ('money-legal', 'Tax Return', 'tax-return'),
    ('money-legal', 'W-2 / 1099', 'w2-1099'),
    ('money-legal', 'Bank Letter', 'bank-letter'),
    ('money-legal', 'Loan Document', 'loan-document'),
    ('money-legal', 'Receipt', 'receipt'),
    ('money-legal', 'Invoice', 'invoice'),
    ('money-legal', 'Court Paper', 'court-paper'),
    ('money-legal', 'Government Notice', 'government-notice'),
    ('money-legal', 'Power of Attorney', 'power-of-attorney'),
    ('money-legal', 'Will / Estate Document', 'will-estate-document'),
    ('work-business', 'Professional License', 'professional-license'),
    ('work-business', 'Certification', 'certification'),
    ('work-business', 'Business License', 'business-license'),
    ('work-business', 'Insurance Certificate', 'insurance-certificate'),
    ('work-business', 'Contract', 'contract'),
    ('work-business', 'Compliance Document', 'compliance-document'),
    ('work-business', 'Training Record', 'training-record'),
    ('work-business', 'Employment Document', 'employment-document'),
    ('work-business', 'Reference Letter', 'reference-letter'),
    ('work-business', 'Resume', 'resume'),
    ('travel-emergency', 'Passport', 'passport-travel'),
    ('travel-emergency', 'Visa', 'visa'),
    ('travel-emergency', 'Travel Insurance', 'travel-insurance'),
    ('travel-emergency', 'Ticket', 'ticket'),
    ('travel-emergency', 'Itinerary', 'itinerary'),
    ('travel-emergency', 'Hotel Confirmation', 'hotel-confirmation'),
    ('travel-emergency', 'Emergency Contact', 'emergency-contact'),
    ('travel-emergency', 'Allergy Information', 'allergy-information'),
    ('travel-emergency', 'Emergency Medical Summary', 'emergency-medical-summary'),
    ('travel-emergency', 'Urgent Backup Document', 'urgent-backup-document')
  as v(category_slug, name, slug)
on c.slug = v.category_slug
on conflict (category_id, user_id, slug) do nothing;

insert into public.document_types (category_id, user_id, name, slug, is_system, is_custom)
select id, null, 'General Document', 'general-' || slug, true, false
from public.document_categories
on conflict (category_id, user_id, slug) do nothing;

alter table public.document_types
  add constraint document_types_slug_scope_unique unique (category_id, user_id, slug);

create index if not exists document_profiles_user_sort_idx on public.document_profiles (user_id, sort_order, created_at);
create index if not exists document_categories_sort_idx on public.document_categories (sort_order, name);
create index if not exists document_types_category_idx on public.document_types (category_id, user_id, is_system, is_custom, slug);
create index if not exists documents_owner_idx on public.documents (user_id, owner_profile_id, category_id, document_type_id);
create index if not exists documents_title_idx on public.documents using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(notes, '')));
create index if not exists documents_tags_idx on public.documents using gin (tags);
create index if not exists document_files_document_role_idx on public.document_files (document_id, file_role, created_at desc);

alter table public.document_profiles enable row level security;
alter table public.document_categories enable row level security;
alter table public.document_types enable row level security;

drop policy if exists document_profiles_select_own on public.document_profiles;
create policy "document_profiles_select_own"
on public.document_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists document_profiles_insert_own on public.document_profiles;
create policy "document_profiles_insert_own"
on public.document_profiles
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists document_profiles_update_own on public.document_profiles;
create policy "document_profiles_update_own"
on public.document_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists document_profiles_delete_own on public.document_profiles;
create policy "document_profiles_delete_own"
on public.document_profiles
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists document_categories_select_authenticated on public.document_categories;
create policy "document_categories_select_authenticated"
on public.document_categories
for select
to authenticated
using (true);

drop policy if exists document_types_select_authenticated on public.document_types;
create policy "document_types_select_authenticated"
on public.document_types
for select
to authenticated
using (is_system = true or user_id = auth.uid());

drop policy if exists document_types_insert_own on public.document_types;
create policy "document_types_insert_own"
on public.document_types
for insert
to authenticated
with check (user_id = auth.uid() and is_custom = true);

drop policy if exists document_types_update_own on public.document_types;
create policy "document_types_update_own"
on public.document_types
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists document_types_delete_own on public.document_types;
create policy "document_types_delete_own"
on public.document_types
for delete
to authenticated
using (user_id = auth.uid());

insert into public.document_profiles (user_id, display_name, profile_type, sort_order)
select distinct d.user_id, 'Me', 'person', 0
from public.documents d
where d.user_id is not null
on conflict do nothing;

update public.document_profiles dp
set display_name = coalesce(dp.display_name, 'Me')
where dp.display_name is null or dp.display_name = '';

update public.document_types dt
set
  slug = coalesce(dt.slug, lower(regexp_replace(dt.name, '[^a-z0-9]+', '-', 'gi'))),
  category_id = coalesce(
    dt.category_id,
    case lower(coalesce(dt.default_category, ''))
      when 'personal' then (select id from public.document_categories where slug = 'personal-family')
      when 'family' then (select id from public.document_categories where slug = 'personal-family')
      when 'driving' then (select id from public.document_categories where slug = 'home-car')
      when 'medical' then (select id from public.document_categories where slug = 'health')
      when 'work' then (select id from public.document_categories where slug = 'work-business')
      when 'business' then (select id from public.document_categories where slug = 'work-business')
      when 'travel' then (select id from public.document_categories where slug = 'travel-emergency')
      else (select id from public.document_categories where slug = 'personal-family')
    end
  ),
  is_custom = coalesce(dt.is_custom, false),
  user_id = case when dt.is_system then null else dt.user_id end
where dt.slug is null or dt.category_id is null or dt.updated_at is not null;

update public.documents d
set
  owner_profile_id = coalesce(
    d.owner_profile_id,
    (
      select dp.id
      from public.document_profiles dp
      where dp.user_id = d.user_id
      order by dp.sort_order asc, dp.created_at asc
      limit 1
    )
  ),
  category_id = coalesce(
    d.category_id,
    case lower(coalesce(d.metadata->>'category', ''))
      when 'personal' then (select id from public.document_categories where slug = 'personal-family')
      when 'family' then (select id from public.document_categories where slug = 'personal-family')
      when 'driving' then (select id from public.document_categories where slug = 'home-car')
      when 'medical' then (select id from public.document_categories where slug = 'health')
      when 'work' then (select id from public.document_categories where slug = 'work-business')
      when 'business' then (select id from public.document_categories where slug = 'work-business')
      when 'travel' then (select id from public.document_categories where slug = 'travel-emergency')
      else (select id from public.document_categories where slug = 'personal-family')
    end
  ),
  document_type_id = coalesce(
    d.document_type_id,
    (
      select dt.id
      from public.document_types dt
      where dt.category_id = coalesce(
        d.category_id,
        case lower(coalesce(d.metadata->>'category', ''))
          when 'personal' then (select id from public.document_categories where slug = 'personal-family')
          when 'family' then (select id from public.document_categories where slug = 'personal-family')
          when 'driving' then (select id from public.document_categories where slug = 'home-car')
          when 'medical' then (select id from public.document_categories where slug = 'health')
          when 'work' then (select id from public.document_categories where slug = 'work-business')
          when 'business' then (select id from public.document_categories where slug = 'work-business')
          when 'travel' then (select id from public.document_categories where slug = 'travel-emergency')
          else (select id from public.document_categories where slug = 'personal-family')
        end
      )
      order by dt.is_system desc, dt.is_custom asc, dt.name asc
      limit 1
    )
  ),
  status = case
    when d.status in ('expired', 'archived', 'needs_review', 'active') then d.status
    when d.status = 'uploaded' then
      case
        when d.expiration_date is not null and d.expiration_date < current_date then 'expired'
        when d.expiration_date is not null and d.expiration_date <= current_date + 30 then 'needs_review'
        else 'active'
      end
    when d.status = 'expiring-soon' then 'needs_review'
    when d.status = 'missing' then 'needs_review'
    else 'needs_review'
  end
where d.owner_profile_id is null or d.category_id is null or d.document_type_id is null or d.status in ('uploaded', 'missing', 'expiring-soon');

update public.document_files df
set
  original_filename = coalesce(df.original_filename, regexp_replace(coalesce(df.storage_path, ''), '^.*/', '')),
  content_type = coalesce(df.content_type, df.mime_type),
  file_role = coalesce(df.file_role, 'original')
where df.original_filename is null or df.content_type is null or df.file_role is null;

alter table public.document_profiles
  alter column display_name set not null,
  alter column profile_type set not null,
  alter column sort_order set not null;

alter table public.document_categories
  alter column name set not null,
  alter column slug set not null,
  alter column sort_order set not null,
  alter column is_system set not null;

alter table public.document_types
  alter column category_id set not null,
  alter column slug set not null,
  alter column is_custom set not null,
  alter column updated_at set not null;

alter table public.document_types
  add constraint document_types_system_user_scope_check
  check (
    (is_system and user_id is null)
    or (not is_system and user_id is not null)
  );

alter table public.documents
  alter column owner_profile_id set not null,
  alter column category_id set not null,
  alter column document_type_id set not null;

alter table public.documents
  drop constraint if exists documents_status_check;

alter table public.documents
  add constraint documents_status_check
  check (status in ('active', 'expired', 'archived', 'needs_review'));

create or replace function public.create_default_document_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.document_profiles (user_id, display_name, profile_type, sort_order)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Me'), 'person', 0)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists create_default_document_profile_on_auth_user on auth.users;
create trigger create_default_document_profile_on_auth_user
after insert on auth.users
for each row execute function public.create_default_document_profile();
