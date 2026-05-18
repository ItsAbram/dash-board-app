create table if not exists public.dashboard_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_state enable row level security;

drop policy if exists "anon can read dashboard state" on public.dashboard_state;
create policy "anon can read dashboard state"
on public.dashboard_state
for select
to anon
using (true);

drop policy if exists "anon can write dashboard state" on public.dashboard_state;
create policy "anon can write dashboard state"
on public.dashboard_state
for insert
to anon
with check (true);

drop policy if exists "anon can update dashboard state" on public.dashboard_state;
create policy "anon can update dashboard state"
on public.dashboard_state
for update
to anon
using (true)
with check (true);
