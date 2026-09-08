-- The document metadata model moved dashboard categories to public.document_categories,
-- but the original documents.category_id foreign key still points at public.categories.
-- Normalize existing rows before replacing the FK so live saves can use document_categories.id.

alter table public.documents
  drop constraint if exists documents_category_id_fkey;

update public.documents d
set category_id = coalesce(
  (
    select dt.category_id
    from public.document_types dt
    where dt.id = d.document_type_id
      and dt.category_id is not null
    limit 1
  ),
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
where d.category_id is null
   or not exists (
     select 1
     from public.document_categories dc
     where dc.id = d.category_id
   );

alter table public.documents
  add constraint documents_category_id_fkey
  foreign key (category_id)
  references public.document_categories(id)
  on delete set null;
