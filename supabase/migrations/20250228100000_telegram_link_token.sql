-- Token per collegare la chat Telegram all'utente (deep link /start TOKEN)
create table if not exists public.telegram_link_token (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_user (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_telegram_link_token_user_created
  on public.telegram_link_token (user_id, created_at desc);

alter table public.telegram_link_token enable row level security;

-- Solo l'utente può creare un token per sé (insert con user_id = auth.uid())
create policy "Users can create link token for themselves"
  on public.telegram_link_token for insert
  with check (user_id = auth.uid());

-- La lettura/delete per token sarà fatta dal webhook con service role (nessuna policy select/delete per utente necessario)
comment on table public.telegram_link_token is 'One-time tokens to link Telegram chat_id to app_user; consumed by webhook on /start';
