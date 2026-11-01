-- Soft-hide sightings that are not the lilgriper via community reports
alter table public.grip_sightings
  add column if not exists is_hidden boolean not null default false,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_reason text;

create table if not exists public.grip_sighting_reports (
  id uuid primary key default gen_random_uuid(),
  sighting_id uuid not null references public.grip_sightings(id) on delete cascade,
  reporter_key text not null check (char_length(reporter_key) between 8 and 64),
  reason text not null default 'not_gripster',
  created_at timestamptz not null default now(),
  unique (sighting_id, reporter_key)
);

alter table public.grip_sighting_reports enable row level security;

drop policy if exists "anyone can insert sighting reports" on public.grip_sighting_reports;
create policy "anyone can insert sighting reports"
  on public.grip_sighting_reports for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anyone can read sighting reports" on public.grip_sighting_reports;
create policy "anyone can read sighting reports"
  on public.grip_sighting_reports for select
  to anon, authenticated
  using (true);

create or replace function public.report_grip_sighting(
  p_sighting_id uuid,
  p_reporter_key text,
  p_reason text default 'not_gripster'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_hidden boolean;
  v_reason text := coalesce(nullif(trim(p_reason), ''), 'not_gripster');
begin
  if p_sighting_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing sighting');
  end if;
  if p_reporter_key is null or char_length(p_reporter_key) < 8 then
    return jsonb_build_object('ok', false, 'error', 'missing reporter');
  end if;
  if not exists (select 1 from grip_sightings where id = p_sighting_id) then
    return jsonb_build_object('ok', false, 'error', 'sighting not found');
  end if;

  insert into grip_sighting_reports (sighting_id, reporter_key, reason)
  values (p_sighting_id, left(p_reporter_key, 64), v_reason)
  on conflict (sighting_id, reporter_key) do nothing;

  select count(*)::integer into v_count
  from grip_sighting_reports
  where sighting_id = p_sighting_id
    and reason = 'not_gripster';

  -- Two distinct reporters: take down photo + zero points
  if v_count >= 2 then
    update grip_sightings
    set
      is_hidden = true,
      hidden_at = coalesce(hidden_at, now()),
      hidden_reason = 'not_gripster',
      points = 0
    where id = p_sighting_id
      and is_hidden = false;
  end if;

  select is_hidden into v_hidden from grip_sightings where id = p_sighting_id;

  return jsonb_build_object(
    'ok', true,
    'reportCount', v_count,
    'hidden', coalesce(v_hidden, false)
  );
end;
$$;

revoke all on function public.report_grip_sighting(uuid, text, text) from public;
grant execute on function public.report_grip_sighting(uuid, text, text) to anon, authenticated;
