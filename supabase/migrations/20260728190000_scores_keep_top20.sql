-- Po wstawieniu wyniku zostaw tylko 20 najlepszych danego użytkownika
-- w obrębie (game, subgame, mode, level). Kierunek wg lower_is_better.
create or replace function gry2.prune_scores()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from gry2.scores s
  where s.user_id = new.user_id
    and s.game    = new.game
    and s.subgame = new.subgame
    and s.mode    = new.mode
    and s.level   = new.level
    and s.id not in (
      select id from gry2.scores
      where user_id = new.user_id
        and game    = new.game
        and subgame = new.subgame
        and mode    = new.mode
        and level   = new.level
      order by
        case when new.lower_is_better then time_seconds end asc  nulls last,
        case when new.lower_is_better then null else score end   desc nulls last,
        created_at desc
      limit 20
    );
  return null;
end;
$$;

drop trigger if exists prune_scores_after_insert on gry2.scores;
create trigger prune_scores_after_insert
  after insert on gry2.scores
  for each row execute function gry2.prune_scores();
