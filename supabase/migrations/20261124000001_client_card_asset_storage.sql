insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('client-card-assets','client-card-assets',true,5242880,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/png','image/jpeg','image/webp'];
drop policy if exists "Public can read client card assets" on storage.objects;
create policy "Public can read client card assets" on storage.objects for select to public using (bucket_id='client-card-assets');
drop policy if exists "Clients upload own card assets" on storage.objects;
create policy "Clients upload own card assets" on storage.objects for insert to authenticated with check (bucket_id='client-card-assets' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Clients update own card assets" on storage.objects;
create policy "Clients update own card assets" on storage.objects for update to authenticated using (bucket_id='client-card-assets' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='client-card-assets' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Clients delete own card assets" on storage.objects;
create policy "Clients delete own card assets" on storage.objects for delete to authenticated using (bucket_id='client-card-assets' and (storage.foldername(name))[1]=auth.uid()::text);
