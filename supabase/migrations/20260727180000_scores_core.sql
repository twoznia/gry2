-- Wyniki gier. Zapis tylko dla zalogowanych; każdy widzi swoje + globalne tabele wyników.
create table if not exists public.scores (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  display_name text,
  game         text not null,            -- np. 'snake', 'reflex/snajper'
  mode         text not null default '', -- np. poziom / wariant ('adult','child','łatwe'...)
  value        numeric not null,         -- wynik lub czas
  lower_is_better boolean not null default false, -- true dla gier na czas
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists scores_game_mode_idx on public.scores (game, mode);
create index if not exists scores_user_idx on public.scores (user_id);

alter table public.scores enable row level security;

-- Odczyt: każdy zalogowany widzi wszystkie wyniki (globalne tabele rekordów).
create policy "scores_select_authenticated"
  on public.scores for select
  to authenticated
  using (true);

-- Zapis: tylko własne wiersze.
create policy "scores_insert_own"
  on public.scores for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "scores_update_own"
  on public.scores for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "scores_delete_own"
  on public.scores for delete
  to authenticated
  using (auth.uid() = user_id);
