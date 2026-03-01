-- Alert: dismissed and acknowledge fields for Rules Alerts Center actions
alter table public.alert add column if not exists dismissed boolean not null default false;
alter table public.alert add column if not exists acknowledged_at timestamptz;
alter table public.alert add column if not exists acknowledged_note text;
comment on column public.alert.dismissed is 'User dismissed this alert from the list';
comment on column public.alert.acknowledged_at is 'User acknowledged (e.g. closed position)';
comment on column public.alert.acknowledged_note is 'Optional note when acknowledging';
