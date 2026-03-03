-- Add mtapi.io provider support: provider, broker_host, broker_port
-- When provider = 'mtapi', metaapi_account_id stores session token; broker_host/port used for Connect (token refresh).
-- Existing rows stay provider = 'metaapi' (default).
alter table public.trading_account
  add column if not exists provider text not null default 'metaapi'
  check (provider in ('metaapi', 'mtapi'));

alter table public.trading_account
  add column if not exists broker_host text;

alter table public.trading_account
  add column if not exists broker_port text;

comment on column public.trading_account.provider is 'Trading API provider: metaapi (metatraderapi.dev) or mtapi (mtapi.io)';
comment on column public.trading_account.broker_host is 'Broker MT server host (for mtapi Connect). e.g. 78.140.180.198';
comment on column public.trading_account.broker_port is 'Broker MT server port (for mtapi Connect). e.g. 443';
