-- RiskSent: Set risksentsaas@gmail.com as admin
-- Run this in Supabase SQL Editor after the user has signed up

-- First, ensure the user exists in auth.users (they must have signed up first)
-- Then update their role in app_user to 'admin'

UPDATE public.app_user
SET role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'risksentsaas@gmail.com'
);

-- Verify the update
SELECT 
  au.id,
  u.email,
  au.role,
  au.created_at
FROM public.app_user au
JOIN auth.users u ON au.id = u.id
WHERE u.email = 'risksentsaas@gmail.com';
