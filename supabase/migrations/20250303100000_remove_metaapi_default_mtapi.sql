-- Default provider to mtapi only (no new metaapi accounts).
-- Run after deleting old MetaAPI-linked accounts (see scripts/delete-old-mt-accounts.sql).
alter table public.trading_account
  alter column provider set default 'mtapi';

comment on column public.trading_account.provider is 'Trading API provider; only mtapi is supported.';
