-- Optional image attachment on say-hey comments
alter table public.lilgrip_comments
  add column if not exists photo_path text;

-- Public bucket for hey photos (anon select + insert, like grip-sightings)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'grip-heys',
  'grip-heys',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone can upload grip hey photos" on storage.objects;
create policy "anyone can upload grip hey photos"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'grip-heys'
    and storage.extension(name) = any (array['jpg','jpeg','png','webp','heic','heif'])
  );

drop policy if exists "anyone can view grip hey photos" on storage.objects;
create policy "anyone can view grip hey photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'grip-heys');
