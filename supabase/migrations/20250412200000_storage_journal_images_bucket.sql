-- Journal Today tab: screenshots bucket (app uses getPublicUrl — bucket should be public)
-- Run via Supabase CLI migrations or paste into SQL Editor if migrations are not applied.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'journal-images',
  'journal-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do nothing;

drop policy if exists "journal_images_insert_authenticated_own_folder" on storage.objects;
drop policy if exists "journal_images_select_public" on storage.objects;
drop policy if exists "journal_images_delete_own" on storage.objects;
drop policy if exists "journal_images_update_own" on storage.objects;

-- Upload only under folder named as the user id (matches /api/journal/images/upload path)
create policy "journal_images_insert_authenticated_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'journal-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read so <img src={publicUrl}> works without cookies
create policy "journal_images_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'journal-images');

create policy "journal_images_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'journal-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'journal-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "journal_images_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'journal-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
