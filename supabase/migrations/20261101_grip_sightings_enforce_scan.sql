-- Allow zero points for hidden/dupes (report + dedupe paths)
alter table public.grip_sightings drop constraint if exists grip_sightings_points_ok;
alter table public.grip_sightings
  add constraint grip_sightings_points_ok check (points >= 0 and points <= 100);

-- Only submit_grip_sighting (security definer) may insert — blocks old/cached clients
drop policy if exists "authenticated can post own grip sightings" on public.grip_sightings;
drop policy if exists "anyone can post grip sightings" on public.grip_sightings;
revoke insert on public.grip_sightings from anon, authenticated;
