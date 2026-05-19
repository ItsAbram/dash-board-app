create table if not exists public.dashboard_state (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_state
add column if not exists user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists dashboard_state_user_id_key
on public.dashboard_state(user_id);

alter table public.dashboard_state enable row level security;

drop policy if exists "anon can read dashboard state" on public.dashboard_state;
drop policy if exists "anon can write dashboard state" on public.dashboard_state;
drop policy if exists "anon can update dashboard state" on public.dashboard_state;
drop policy if exists "users can read own dashboard state" on public.dashboard_state;
drop policy if exists "users can insert own dashboard state" on public.dashboard_state;
drop policy if exists "users can update own dashboard state" on public.dashboard_state;
drop policy if exists "users can delete own dashboard state" on public.dashboard_state;

create policy "users can read own dashboard state"
on public.dashboard_state
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own dashboard state"
on public.dashboard_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own dashboard state"
on public.dashboard_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own dashboard state"
on public.dashboard_state
for delete
to authenticated
using ((select auth.uid()) = user_id);
