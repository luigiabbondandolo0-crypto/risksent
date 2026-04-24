-- Scope AI Coach reports and chat to a journal account; enables per-account rate limits.

alter table public.ai_coach_report
  add column if not exists journal_account_id uuid references public.journal_account (id) on delete cascade;

alter table public.ai_coach_message
  add column if not exists journal_account_id uuid references public.journal_account (id) on delete cascade;

create index if not exists idx_ai_coach_report_user_journal_created
  on public.ai_coach_report (user_id, journal_account_id, created_at desc);

create index if not exists idx_ai_coach_message_user_journal_created
  on public.ai_coach_message (user_id, journal_account_id, created_at asc);
