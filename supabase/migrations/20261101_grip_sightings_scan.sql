-- Photo fingerprints + cooldown for grip sightings
alter table public.grip_sightings
  add column if not exists photo_sha256 text,
  add column if not exists photo_dhash text;

create unique index if not exists grip_sightings_photo_sha256_uidx
  on public.grip_sightings (photo_sha256)
  where photo_sha256 is not null and is_hidden = false;

create index if not exists grip_sightings_photo_dhash_idx
  on public.grip_sightings (photo_dhash)
  where photo_dhash is not null and is_hidden = false;

create index if not exists grip_sightings_user_created_idx
  on public.grip_sightings (user_id, created_at desc)
  where user_id is not null;

-- Recent fingerprints for near-dup checks (anon readable via this RPC only)
create or replace function public.grip_sighting_fingerprints(p_limit integer default 80)
returns table (
  photo_sha256 text,
  photo_dhash text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select s.photo_sha256, s.photo_dhash, s.created_at
  from public.grip_sightings s
  where s.is_hidden = false
    and (s.photo_sha256 is not null or s.photo_dhash is not null)
  order by s.created_at desc
  limit greatest(1, least(coalesce(p_limit, 80), 200));
$$;

revoke all on function public.grip_sighting_fingerprints(integer) from public;
grant execute on function public.grip_sighting_fingerprints(integer) to anon, authenticated;

-- Atomic insert with cooldown + exact-hash uniqueness
create or replace function public.submit_grip_sighting(
  p_hunter text,
  p_place text,
  p_photo_path text,
  p_photo_sha256 text,
  p_photo_dhash text default null,
  p_points integer default 10,
  p_cooldown_minutes integer default 15
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hunter text;
  v_place text;
  v_sha text;
  v_dhash text;
  v_last timestamptz;
  v_wait_seconds integer;
  v_id uuid;
  v_cooldown integer := greatest(1, least(coalesce(p_cooldown_minutes, 15), 1440));
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'sign in to log a sighting');
  end if;

  if p_photo_path is null or length(trim(p_photo_path)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'missing photo');
  end if;

  v_sha := nullif(lower(trim(p_photo_sha256)), '');
  if v_sha is null or v_sha !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'error', 'photo scan incomplete — try another image');
  end if;

  v_dhash := nullif(lower(trim(coalesce(p_photo_dhash, ''))), '');
  if v_dhash is not null and v_dhash !~ '^[0-9a-f]{16}$' then
    v_dhash := null;
  end if;

  v_hunter := left(trim(coalesce(p_hunter, '')), 24);
  if v_hunter = '' then
    v_hunter := 'anon';
  end if;
  v_place := left(trim(coalesce(p_place, '')), 80);

  select s.created_at into v_last
  from public.grip_sightings s
  where s.user_id = v_uid
  order by s.created_at desc
  limit 1;

  if v_last is not null and v_last > now() - make_interval(mins => v_cooldown) then
    v_wait_seconds := greatest(
      1,
      ceil(extract(epoch from (v_last + make_interval(mins => v_cooldown) - now())))::integer
    );
    return jsonb_build_object(
      'ok', false,
      'error', format('cooldown — wait %s before another sighting', v_wait_seconds || 's'),
      'retryAfterSeconds', v_wait_seconds
    );
  end if;

  if exists (
    select 1 from public.grip_sightings s
    where s.photo_sha256 = v_sha
      and s.is_hidden = false
  ) then
    return jsonb_build_object(
      'ok', false,
      'error', 'that exact photo was already logged. snap a fresh one.'
    );
  end if;

  insert into public.grip_sightings (
    hunter, place, photo_path, points, user_id, photo_sha256, photo_dhash
  ) values (
    v_hunter,
    v_place,
    left(trim(p_photo_path), 240),
    greatest(0, least(coalesce(p_points, 10), 100)),
    v_uid,
    v_sha,
    v_dhash
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
exception
  when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'error', 'that exact photo was already logged. snap a fresh one.'
    );
end;
$$;

revoke all on function public.submit_grip_sighting(text, text, text, text, text, integer, integer) from public;
grant execute on function public.submit_grip_sighting(text, text, text, text, text, integer, integer) to authenticated;
