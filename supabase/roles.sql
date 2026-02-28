-- RiskSent user roles: admin > trader > customer
-- Run this in Supabase SQL Editor after app_user exists.

-- 1) Add role column (replaces is_admin for new hierarchy)
alter table app_user
add column if not exists role text not null default 'customer'
  check (role in ('admin', 'trader', 'customer'));

-- 2) Migrate existing is_admin to role (if column exists)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'app_user' and column_name = 'is_admin'
  ) then
    update app_user set role = 'admin' where is_admin = true;
  end if;
end $$;

-- 3) Add trader_id for customers (links customer to their trader)
alter table app_user
add column if not exists assigned_trader_id uuid references app_user (id) on delete set null;

-- assigned_trader_id: only for customers; references a trader (role='trader')
-- Enforce in app logic; FK ensures referenced user exists.

-- 4) Optional: drop is_admin if you no longer need it
-- alter table app_user drop column if exists is_admin;

-- Hierarchy summary:
-- - admin: full access, can manage all users and data
-- - trader: can manage all trades of customers linked via assigned_trader_id
-- - customer: can only see their own trades; optionally linked to a trader
