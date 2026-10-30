const CURSOR_API_BASE = "https://api.cursor.com/v1";

export type CreateAgentResult =
	| { ok: true; agentId: string; runId?: string }
	| { ok: false; error: string };

/** Map Cursor Cloud Agents API failures to visitor-safe copy. */
export function humanizeCursorAgentError(
	status: number,
	bodyText: string,
): string {
	const snippet = bodyText.slice(0, 500);
	let code = "";
	let message = "";
	try {
		const parsed = JSON.parse(bodyText) as {
			error?: { code?: string; message?: string };
			code?: string;
			message?: string;
		};
		code = parsed.error?.code ?? parsed.code ?? "";
		message = parsed.error?.message ?? parsed.message ?? "";
	} catch {
		// keep raw snippet path below
	}

	if (
		code === "usage_limit_exceeded" ||
		/prepaid balance is used up|usage_limit_exceeded|add funds/i.test(
			`${code} ${message} ${snippet}`,
		)
	) {
		return "Cursor Cloud Agents billing is empty — add funds or enable auto top-up on the Cursor account that owns CURSOR_API_KEY, then try again tomorrow (one enqueue per handle per UTC day).";
	}
	if (status === 401 || /Invalid User API Key/i.test(snippet)) {
		return "Cursor API key rejected — check CURSOR_API_KEY in Supabase secrets.";
	}
	return `Cursor API ${status}: ${snippet}`;
}

/** Value for the Authorization header (Basic auth: API key as username, empty password). */
function basicAuthValue(apiKey: string): string {
	const trimmed = apiKey.trim();
	const token = btoa(`${trimmed}:`);
	return `Basic ${token}`;
}

export async function createCloudAgent(options: {
	apiKey: string;
	name: string;
	promptText: string;
	repoUrl: string;
	startingRef?: string;
	branchName?: string;
}): Promise<CreateAgentResult> {
	const body: Record<string, unknown> = {
		name: options.name.slice(0, 100),
		prompt: { text: options.promptText },
		repos: [
			{
				url: options.repoUrl,
				startingRef: options.startingRef ?? "main",
			},
		],
	};

	const res = await fetch(`${CURSOR_API_BASE}/agents`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: basicAuthValue(options.apiKey),
		},
		body: JSON.stringify(body),
	});

	const text = await res.text();
	if (!res.ok) {
		return {
			ok: false,
			error: humanizeCursorAgentError(res.status, text),
		};
	}

	try {
		const json = JSON.parse(text) as {
			agent?: { id?: string };
			run?: { id?: string };
		};
		const agentId = json.agent?.id;
		if (!agentId) {
			return { ok: false, error: "Cursor API response missing agent.id" };
		}
		return { ok: true, agentId, runId: json.run?.id };
	} catch {
		return { ok: false, error: "Invalid JSON from Cursor API" };
	}
}

export function plannerPrompt(handle: string, elaboratedBrief: string): string {
	return `You are the Community Builds PLANNER for lilgrip.com.

Read and follow:
- .cursor/skills/gripapps/SKILL.md
- docs/gripapps/AGENT_GUIDE.md
- docs/gripapps/COOKBOOK.md
- docs/community/MODERATION.md

Handle: ${handle}
Sandbox writes ONLY: public/community/${handle}/**

Produce a markdown plan (plan_md) with: gallery title, blurb, UX sketch, GripApps scenes/actions inside sandbox, moderation confirmation.

Visual requirements (non-negotiable): pick a named meta.theme (neon_lagoon, barn_night, candy_arcade, deep_space, or lilgrip_default); open with hero and/or canvas play (or emoji_stage for tap toys); use scene vibe/motion where it fits. Do NOT plan text+button-only stack walls.

Visitor brief:
${elaboratedBrief}
`;
}

export function builderPrompt(
	handle: string,
	planOrBrief: string,
	branchName: string,
): string {
	return `You are the Community Builds BUILDER for lilgrip.com.

Read and follow:
- .cursor/skills/gripapps/SKILL.md
- docs/gripapps/AGENT_GUIDE.md
- docs/gripapps/COOKBOOK.md
- docs/community/MODERATION.md

Handle: ${handle}
Branch: ${branchName}
Writes ONLY under: public/community/${handle}/**
Required: app.grip, index.html, app.grip.js, manifest.json, vendor/gripapps/runtime.js

Implement the approved plan with GripApps under the visual enrich workflow:

1. Draft app.grip (start from gripapps/templates/visual_play.grip): meta.theme required; hero and/or canvas (or emoji_stage). Reject shipping text+button-only UI.
2. bun run gripc -- enrich public/community/${handle}/app.grip — expand thin lines in place; maintain enrich-notes.md; raw_module only if Grip cannot carry the look.
3. bun run gripc -- check public/community/${handle}/app.grip
4. bun run gripc -- check --visual public/community/${handle}/app.grip (must pass)
5. bun run gripc -- build public/community/${handle}/app.grip --out public/community/${handle} --handle ${handle}

Commit app.grip, enrich-notes.md if present, and built assets. Wipe prior built files in this handle folder when replacing.

Plan / brief:
${planOrBrief}
`;
}

export async function launchPlannerAgent(
	apiKey: string,
	repoUrl: string,
	handle: string,
	elaboratedBrief: string,
): Promise<CreateAgentResult> {
	return createCloudAgent({
		apiKey,
		name: `community-plan-${handle}`,
		promptText: plannerPrompt(handle, elaboratedBrief),
		repoUrl,
		startingRef: "main",
	});
}

export async function launchBuilderAgent(
	apiKey: string,
	repoUrl: string,
	handle: string,
	planOrBrief: string,
	branchName: string,
): Promise<CreateAgentResult> {
	return createCloudAgent({
		apiKey,
		name: `community-build-${handle}`,
		promptText: builderPrompt(handle, planOrBrief, branchName),
		repoUrl,
		startingRef: "main",
	});
}
