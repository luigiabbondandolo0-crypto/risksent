# Scripts

## Legacy trading accounts (historical)

Older migrations and SQL helpers referred to MetaTrader API providers (`metaapi`, `mtapi.io`). The app no longer calls those HTTP APIs from `lib/tradingApi.ts`; broker linking is disabled until a new provider is integrated.

- Optional cleanup: `scripts/delete-old-mt-accounts.sql` (if you still need to purge rows by `provider` in Supabase, use the SQL Editor and adjust the `WHERE` clause for your case).

- Historical migrations under `supabase/migrations/` (e.g. provider defaults) are kept for database history; do not delete applied migration files.
