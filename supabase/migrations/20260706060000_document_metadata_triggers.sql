drop trigger if exists set_document_profiles_updated_at on public.document_profiles;
create trigger set_document_profiles_updated_at
before update on public.document_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_document_categories_updated_at on public.document_categories;
create trigger set_document_categories_updated_at
before update on public.document_categories
for each row execute function public.set_updated_at();
