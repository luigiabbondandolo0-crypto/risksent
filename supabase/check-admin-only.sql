-- RiskSent: Check admin status ONLY (read-only)
-- Run this in Supabase SQL Editor to verify admin roles

SELECT 
  u.id,
  u.email,
  au.role,
  CASE 
    WHEN au.role = 'admin' THEN '✅ ADMIN'
    WHEN au.role IS NULL THEN '❌ NO APP_USER RECORD'
    WHEN au.role = 'customer' THEN '⚠️ CUSTOMER'
    WHEN au.role = 'trader' THEN '⚠️ TRADER'
    ELSE '❌ UNKNOWN ROLE (' || au.role || ')'
  END as status,
  au.created_at as app_user_created,
  u.created_at as auth_user_created,
  u.last_sign_in_at
FROM auth.users u
LEFT JOIN public.app_user au ON u.id = au.id
WHERE u.email IN ('risksentsaas@gmail.com', 'luigiabbondandolo0@gmail.com')
ORDER BY u.email;
