-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Confirm the email (Bypass email verification link)
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'ovi.extra@gmail.com';

-- 2. Grant Admin Role in profiles table
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'ovi.extra@gmail.com'
);

-- 3. Verify the result
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'ovi.extra@gmail.com';
SELECT * FROM public.profiles WHERE role = 'admin';
