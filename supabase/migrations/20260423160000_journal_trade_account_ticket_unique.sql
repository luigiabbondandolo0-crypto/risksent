-- Idempotent MetaApi → journal_trade sync (upsert on account_id + ticket)
create unique index if not exists journal_trade_account_id_ticket_key
  on public.journal_trade (account_id, ticket);
