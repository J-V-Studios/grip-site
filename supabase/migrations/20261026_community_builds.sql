-- Community Builds: creators + build pipeline rows (see design spec §4)

create table if not exists public.community_creators (
	handle text primary key,
	edit_code_hash text not null,
	created_at timestamptz not null default now(),
	last_build_at timestamptz,
	is_banned boolean not null default false,
	constraint community_creators_handle_format check (
		handle ~ '^[a-z0-9]([a-z0-9-]{1,22}[a-z0-9])?$'
	)
);

create table if not exists public.community_builds (
	id uuid primary key default gen_random_uuid(),
	handle text not null references public.community_creators (handle) on delete cascade,
	status text not null,
	prompt text not null,
	elaborated_brief text,
	plan_md text,
	moderation_notes text,
	title text,
	blurb text,
	agent_plan_id text,
	agent_build_id text,
	pr_url text,
	branch_name text,
	error text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint community_builds_status_allowed check (
		status in (
			'queued',
			'moderating',
			'planning',
			'building',
			'live',
			'rejected',
			'failed'
		)
	),
	constraint community_builds_prompt_length check (char_length(prompt) <= 500)
);

create index if not exists community_builds_handle_idx
	on public.community_builds (handle);

create index if not exists community_builds_status_updated_idx
	on public.community_builds (status, updated_at desc)
	where status = 'live';

create or replace function public.community_builds_set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists community_builds_updated_at on public.community_builds;

create trigger community_builds_updated_at
before update on public.community_builds
for each row
execute function public.community_builds_set_updated_at();

-- Public gallery: live builds only, no prompts/secrets/agent ids
create or replace view public.community_gallery
with (security_invoker = false)
as
select
	b.handle,
	b.title,
	b.blurb,
	b.updated_at
from public.community_builds as b
where b.status = 'live';

grant select on public.community_gallery to anon, authenticated;

alter table public.community_creators enable row level security;
alter table public.community_builds enable row level security;

-- No anon/authenticated policies on base tables: reads go through community_gallery only.
-- Orchestrator uses service role (bypasses RLS) for writes and privileged reads.
