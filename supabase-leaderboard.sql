-- Run this in Supabase → SQL Editor (once)

create table if not exists public.leaderboard (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  best_wave int not null default 0,
  best_score int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

drop policy if exists "leaderboard_read" on public.leaderboard;
create policy "leaderboard_read" on public.leaderboard
  for select using (true);

drop policy if exists "leaderboard_upsert_own" on public.leaderboard;
create policy "leaderboard_upsert_own" on public.leaderboard
  for insert with check (auth.uid() = user_id);

drop policy if exists "leaderboard_update_own" on public.leaderboard;
create policy "leaderboard_update_own" on public.leaderboard
  for update using (auth.uid() = user_id);

-- Also: Auth → Providers → Email → turn OFF "Confirm email"
