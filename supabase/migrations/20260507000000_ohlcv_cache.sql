-- OHLCV cache: stores historical candle data fetched from TwelveData.
-- Historical OHLC never changes so TTL is long (30 days).
-- Keyed by (symbol, timeframe, date_from, date_to) — all text for simplicity.

create table if not exists public.ohlcv_cache (
  id           bigint generated always as identity primary key,
  symbol       text        not null,
  timeframe    text        not null,
  date_from    text        not null,
  date_to      text        not null,
  candles      jsonb       not null,
  cached_at    timestamptz not null default now()
);

create unique index if not exists ohlcv_cache_key
  on public.ohlcv_cache (symbol, timeframe, date_from, date_to);

create index if not exists ohlcv_cache_cached_at
  on public.ohlcv_cache (cached_at);

-- Only service role can read/write; no RLS needed (server-side only).
alter table public.ohlcv_cache enable row level security;

-- No public access — accessed exclusively via service role key server-side.
