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

create table if not exists public.workout_blocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  block_id text not null,
  block_name text not null,
  start_date date not null,
  end_date date not null,
  goal text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, block_id)
);

create table if not exists public.workout_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  block_id text not null,
  date date not null,
  session_name text not null,
  template_name text not null default '',
  priority text not null default 'normal',
  estimated_minutes integer,
  tags text[] not null default '{}',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

create table if not exists public.workout_exercises (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  session_id text not null,
  order_index integer not null default 0,
  exercise_name text not null,
  sets text not null default '',
  reps text not null default '',
  target_load text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

create table if not exists public.workout_session_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  status text not null check (status in ('complete', 'skipped')),
  completed_at timestamptz not null default now(),
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

create table if not exists public.workout_exercise_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  done boolean not null default false,
  completed_at timestamptz,
  actual_sets text not null default '',
  actual_reps text not null default '',
  actual_load text not null default '',
  actual_rpe text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.workout_exercise_completions
add column if not exists actual_sets text not null default '',
add column if not exists actual_reps text not null default '',
add column if not exists actual_load text not null default '',
add column if not exists actual_rpe text not null default '';

create table if not exists public.workout_exercise_sets (
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id text not null,
  exercise_id text not null,
  set_number integer not null default 1,
  set_type text not null default 'work' check (set_type in ('warmup', 'work')),
  reps text not null default '',
  load text not null default '',
  rpe text not null default '',
  done boolean not null default false,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, set_id)
);

alter table public.workout_blocks enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_session_completions enable row level security;
alter table public.workout_exercise_completions enable row level security;
alter table public.workout_exercise_sets enable row level security;

grant select, insert, update, delete on public.workout_blocks to authenticated;
grant select, insert, update, delete on public.workout_sessions to authenticated;
grant select, insert, update, delete on public.workout_exercises to authenticated;
grant select, insert, update, delete on public.workout_session_completions to authenticated;
grant select, insert, update, delete on public.workout_exercise_completions to authenticated;
grant select, insert, update, delete on public.workout_exercise_sets to authenticated;

drop policy if exists "users can read own workout blocks" on public.workout_blocks;
drop policy if exists "users can insert own workout blocks" on public.workout_blocks;
drop policy if exists "users can update own workout blocks" on public.workout_blocks;
drop policy if exists "users can delete own workout blocks" on public.workout_blocks;

drop policy if exists "users can read own workout sessions" on public.workout_sessions;
drop policy if exists "users can insert own workout sessions" on public.workout_sessions;
drop policy if exists "users can update own workout sessions" on public.workout_sessions;
drop policy if exists "users can delete own workout sessions" on public.workout_sessions;

drop policy if exists "users can read own workout exercises" on public.workout_exercises;
drop policy if exists "users can insert own workout exercises" on public.workout_exercises;
drop policy if exists "users can update own workout exercises" on public.workout_exercises;
drop policy if exists "users can delete own workout exercises" on public.workout_exercises;

drop policy if exists "users can read own workout session completions" on public.workout_session_completions;
drop policy if exists "users can insert own workout session completions" on public.workout_session_completions;
drop policy if exists "users can update own workout session completions" on public.workout_session_completions;
drop policy if exists "users can delete own workout session completions" on public.workout_session_completions;

drop policy if exists "users can read own workout exercise completions" on public.workout_exercise_completions;
drop policy if exists "users can insert own workout exercise completions" on public.workout_exercise_completions;
drop policy if exists "users can update own workout exercise completions" on public.workout_exercise_completions;
drop policy if exists "users can delete own workout exercise completions" on public.workout_exercise_completions;

drop policy if exists "users can read own workout exercise sets" on public.workout_exercise_sets;
drop policy if exists "users can insert own workout exercise sets" on public.workout_exercise_sets;
drop policy if exists "users can update own workout exercise sets" on public.workout_exercise_sets;
drop policy if exists "users can delete own workout exercise sets" on public.workout_exercise_sets;

create policy "users can read own workout blocks"
on public.workout_blocks for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own workout blocks"
on public.workout_blocks for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own workout blocks"
on public.workout_blocks for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own workout blocks"
on public.workout_blocks for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read own workout sessions"
on public.workout_sessions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own workout sessions"
on public.workout_sessions for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own workout sessions"
on public.workout_sessions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own workout sessions"
on public.workout_sessions for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read own workout exercises"
on public.workout_exercises for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own workout exercises"
on public.workout_exercises for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own workout exercises"
on public.workout_exercises for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own workout exercises"
on public.workout_exercises for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read own workout session completions"
on public.workout_session_completions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own workout session completions"
on public.workout_session_completions for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own workout session completions"
on public.workout_session_completions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own workout session completions"
on public.workout_session_completions for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read own workout exercise completions"
on public.workout_exercise_completions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own workout exercise completions"
on public.workout_exercise_completions for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own workout exercise completions"
on public.workout_exercise_completions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own workout exercise completions"
on public.workout_exercise_completions for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read own workout exercise sets"
on public.workout_exercise_sets for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own workout exercise sets"
on public.workout_exercise_sets for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own workout exercise sets"
on public.workout_exercise_sets for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own workout exercise sets"
on public.workout_exercise_sets for delete to authenticated
using ((select auth.uid()) = user_id);
