-- MetaApi account UUID for live stats when journal is the primary link.
-- Optional backfill for rows that already have trading_account:
-- update journal_account j
-- set metaapi_account_id = t.metaapi_account_id
-- from trading_account t
-- where j.user_id = t.user_id and j.account_number = t.account_number and j.metaapi_account_id is null;

alter table public.journal_account
  add column if not exists metaapi_account_id text;

comment on column public.journal_account.metaapi_account_id is 'MetaApi.cloud account id; mirrors trading_account.metaapi_account_id for dashboard/API resolution';
