-- RiskSent: Check and set admin roles for specific emails
-- Run this in Supabase SQL Editor

-- 1. Check current admin status for both emails
SELECT 
  u.id,
  u.email,
  au.role,
  au.created_at as app_user_created,
  u.created_at as auth_user_created
FROM auth.users u
LEFT JOIN public.app_user au ON u.id = au.id
WHERE u.email IN ('risksentsaas@gmail.com', 'luigiabbondandolo0@gmail.com')
ORDER BY u.email;

-- 2. If app_user doesn't exist for these users, create them
INSERT INTO public.app_user (id, role)
SELECT 
  u.id,
  'customer' -- Default role, will be updated below
FROM auth.users u
WHERE u.email IN ('risksentsaas@gmail.com', 'luigiabbondandolo0@gmail.com')
  AND NOT EXISTS (
    SELECT 1 FROM public.app_user au WHERE au.id = u.id
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Set both emails as admin
UPDATE public.app_user
SET role = 'admin'
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email IN ('risksentsaas@gmail.com', 'luigiabbondandolo0@gmail.com')
);

-- 4. Verify the update
SELECT 
  u.id,
  u.email,
  au.role,
  CASE 
    WHEN au.role = 'admin' THEN '✅ ADMIN'
    WHEN au.role IS NULL THEN '❌ NO APP_USER RECORD'
    ELSE '❌ NOT ADMIN (' || au.role || ')'
  END as status,
  au.created_at as app_user_created,
  u.created_at as auth_user_created
FROM auth.users u
LEFT JOIN public.app_user au ON u.id = au.id
WHERE u.email IN ('risksentsaas@gmail.com', 'luigiabbondandolo0@gmail.com')
ORDER BY u.email;
