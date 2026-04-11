-- Daily checklist completion + rules followed on journal_session (Today tab)
alter table public.journal_session
  add column if not exists checklist_done jsonb not null default '{}'::jsonb,
  add column if not exists rules_followed jsonb not null default '{}'::jsonb;
