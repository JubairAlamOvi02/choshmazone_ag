-- Execute this in the Supabase SQL Editor to Ensure Storage Policies are correct

-- 1. Allow Public Read Access to 'products' bucket
-- This ensures your product images are visible on the website
create policy "Public Read Access"
on storage.objects for select
using ( bucket_id = 'products' );

-- 2. Allow Admins (Authenticated Users) to Upload
-- Note: Ideally we check for role='admin', but for now 'authenticated' allows any logged in user
-- You can make this stricter later.
create policy "Authenticated Upload Access"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'products' );

-- 3. Allow Admins to Update/Delete (Optional but recommended for Full management)
create policy "Authenticated Update Access"
on storage.objects for update
to authenticated
using ( bucket_id = 'products' );

create policy "Authenticated Delete Access"
on storage.objects for delete
to authenticated
using ( bucket_id = 'products' );
