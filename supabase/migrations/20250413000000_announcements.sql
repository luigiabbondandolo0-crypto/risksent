-- In-app admin announcements (banners). Safe to run if the table already exists.

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info', 'warning', 'success', 'error')),
  target_plan text not null default 'all' check (target_plan in ('all', 'free', 'new_trader', 'experienced')),
  active boolean not null default true,
  expires_at timestamptz
);

create index if not exists announcements_active_created_idx
  on public.announcements (active, created_at desc);

alter table public.announcements enable row level security;

-- No user policies: only service role (API routes) reads/writes.
