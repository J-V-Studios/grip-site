-- Link sightings to auth users; public leaderboard for grip points
alter table public.grip_sightings
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists grip_sightings_user_id_idx
  on public.grip_sightings (user_id)
  where user_id is not null;

-- Unique hunter usernames (case-insensitive) when set
create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username))
  where username is not null and length(trim(username)) > 0;

-- Anon can read public profile display fields for leaderboard names
drop policy if exists "profiles_select_public_display" on public.profiles;
create policy "profiles_select_public_display"
  on public.profiles for select
  to anon, authenticated
  using (username is not null);

-- Require auth to post sightings (points track to account)
drop policy if exists "anyone can post grip sightings" on public.grip_sightings;
drop policy if exists "authenticated can post own grip sightings" on public.grip_sightings;
create policy "authenticated can post own grip sightings"
  on public.grip_sightings for insert
  to authenticated
  with check (user_id = auth.uid());

create or replace function public.grip_points_leaderboard(p_limit integer default 10)
returns table (
  user_id uuid,
  hunter text,
  points bigint,
  sightings bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.user_id,
    coalesce(
      nullif(trim(p.username), ''),
      nullif(trim(p.display_name), ''),
      nullif(trim(max(s.hunter)), ''),
      'anon'
    ) as hunter,
    sum(s.points)::bigint as points,
    count(*)::bigint as sightings
  from public.grip_sightings s
  left join public.profiles p on p.id = s.user_id
  where s.is_hidden = false
    and s.points > 0
    and s.user_id is not null
  group by s.user_id, p.username, p.display_name
  order by points desc, hunter asc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke all on function public.grip_points_leaderboard(integer) from public;
grant execute on function public.grip_points_leaderboard(integer) to anon, authenticated;

create or replace function public.claim_grip_username(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_clean text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not signed in');
  end if;

  v_clean := lower(trim(p_username));
  if v_clean is null or v_clean !~ '^[a-z0-9_]{3,24}$' then
    return jsonb_build_object('ok', false, 'error', 'username must be 3-24 letters, numbers, or _');
  end if;

  if exists (
    select 1 from profiles
    where lower(username) = v_clean and id <> v_uid
  ) then
    return jsonb_build_object('ok', false, 'error', 'username taken');
  end if;

  update profiles
  set
    username = v_clean,
    display_name = coalesce(nullif(trim(display_name), ''), v_clean),
    updated_at = now()
  where id = v_uid;

  return jsonb_build_object('ok', true, 'username', v_clean);
end;
$$;

revoke all on function public.claim_grip_username(text) from public;
grant execute on function public.claim_grip_username(text) to authenticated;
