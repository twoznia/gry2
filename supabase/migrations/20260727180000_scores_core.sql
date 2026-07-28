-- Dedykowany schemat gry2 na rekordy wszystkich gier.
-- Zapis tylko dla zalogowanych; każdy zalogowany widzi globalne tabele rekordów.
drop table if exists public.scores cascade;
create schema if not exists gry2;

-- user + gra + podgra (reflex ma warianty) + wszystkie pola rekordów.
create table if not exists gry2.scores (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  display_name  text,
  game          text not null,             -- np. 'snake', 'reflex', 'soltaire'
  subgame       text not null default '',  -- wariant/podgra, np. 'znikanie' (reflex)
  mode          text not null default '',  -- tryb: 'adult','child' itp.
  level         text not null default '',  -- poziom: 'level1'..'total', trudność
  score         numeric,                   -- wynik punktowy (wyższy lepszy)
  time_seconds  numeric,                   -- czas (niższy lepszy) — gry na czas
  errors        integer,                   -- liczba błędów (np. reflex snajper)
  wave          integer,                   -- fala (np. obrona)
  lower_is_better boolean not null default false,
  meta          jsonb not null default '{}'::jsonb, -- dowolne dodatkowe pola
  created_at    timestamptz not null default now()
);

create index if not exists scores_game_idx on gry2.scores (game, subgame, mode, level);
create index if not exists scores_user_idx on gry2.scores (user_id);

alter table gry2.scores enable row level security;

create policy "scores_select_authenticated"
  on gry2.scores for select to authenticated using (true);
create policy "scores_insert_own"
  on gry2.scores for insert to authenticated with check (auth.uid() = user_id);
create policy "scores_update_own"
  on gry2.scores for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "scores_delete_own"
  on gry2.scores for delete to authenticated using (auth.uid() = user_id);

-- Uprawnienia dla ról PostgREST (dostęp do wierszy nadal pilnuje RLS).
grant usage on schema gry2 to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema gry2 to anon, authenticated, service_role;
alter default privileges in schema gry2 grant select, insert, update, delete on tables to anon, authenticated, service_role;

-- Wystaw schemat gry2 w API PostgREST (uruchom osobno, poza transakcją migracji):
--   alter role authenticator set pgrst.db_schemas = 'public, graphql_public, gry2';
--   notify pgrst, 'reload config';
--   notify pgrst, 'reload schema';
-- Albo w panelu: Settings → API → Exposed schemas → dodaj 'gry2'.