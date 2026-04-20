-- One-trial-per-user enforcement.
-- We record the moment a user's free trial is started. Once set, the column
-- is NEVER reset (not even on cancel / downgrade / delete+recreate sub row),
-- so the /api/stripe/start-trial endpoint can refuse to issue another trial.

alter table public.subscriptions
  add column if not exists trial_started_at timestamptz;

-- Back-fill: any existing row that is currently trialing or has ever held
-- the "trial" plan should be treated as having used its trial already.
update public.subscriptions
   set trial_started_at = coalesce(trial_started_at, current_period_start, now())
 where trial_started_at is null
   and (plan = 'trial' or status = 'trialing');

-- Fast lookup for "has this user ever trialed?"
create index if not exists idx_subscriptions_trial_started_at
  on public.subscriptions (user_id)
  where trial_started_at is not null;
