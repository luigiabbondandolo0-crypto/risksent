-- Add account_name to trading_account (optional display name).
-- Run this in Supabase SQL Editor if you get: column trading_account.account_name does not exist

alter table public.trading_account
add column if not exists account_name text;
