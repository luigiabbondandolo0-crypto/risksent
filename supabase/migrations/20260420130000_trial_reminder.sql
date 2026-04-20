-- Tracks whether we've already sent the "trial ending soon" reminder email.
-- The cron at /api/cron/trial-reminder filters on this column so each user
-- receives exactly one reminder per trial, even if the job runs multiple times.

alter table public.subscriptions
  add column if not exists trial_reminder_sent_at timestamptz;

-- Index to speed up the daily cron scan over still-pending reminders.
create index if not exists idx_subscriptions_trial_reminder_pending
  on public.subscriptions (current_period_end)
  where plan = 'trial'
    and status = 'trialing'
    and trial_reminder_sent_at is null;
