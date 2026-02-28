-- RiskSent: accounts management & admin roles
-- Run in Supabase SQL Editor. Ensures each MT account is linked to a single trader (app_user).

-- 1) Ensure app_user exists and has role column (for admin UI)
alter table app_user
add column if not exists role text not null default 'customer'
  check (role in ('admin', 'trader', 'customer'));

-- 2) Optional: assign admin role to your email (run after app_user row exists for that user)
-- First ensure the user has signed up so auth.users has the row, and app_user is created on first login or via trigger.
-- Then:
-- update app_user
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'luigiabbondandolo0@gmail.com');

-- 3) trading_account: each row is one MT account linked to one user (trader) via user_id.
-- No schema change needed; existing unique (user_id, broker_type, account_number) enforces one MT account per trader.

-- 4) Optional: trigger to create app_user on first signup (if not already done)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.app_user (id, role)
  values (new.id, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Grant your admin user the admin role (replace with your user id from auth.users)
-- update app_user set role = 'admin' where id = 'YOUR_USER_UUID';
