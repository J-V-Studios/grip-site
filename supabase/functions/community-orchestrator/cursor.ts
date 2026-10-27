const CURSOR_API_BASE = "https://api.cursor.com/v1";

export type CreateAgentResult =
	| { ok: true; agentId: string; runId?: string }
	| { ok: false; error: string };

function basicAuthHeader(apiKey: string): string {
	const token = btoa(`${apiKey}:`);
	return `Authorization: Basic ${token}`;
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
			Authorization: basicAuthHeader(options.apiKey),
		},
		body: JSON.stringify(body),
	});

	const text = await res.text();
	if (!res.ok) {
		return {
			ok: false,
			error: `Cursor API ${res.status}: ${text.slice(0, 500)}`,
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
- .cursor/skills/community-builder/SKILL.md
- docs/community/AGENT_GUIDE.md
- docs/community/MODERATION.md

Handle: ${handle}
Sandbox writes ONLY: public/community/${handle}/**

Produce a markdown plan (plan_md) with: gallery title, blurb, UX sketch, tech inside sandbox, moderation confirmation.

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
- .cursor/skills/community-builder/SKILL.md
- docs/community/AGENT_GUIDE.md
- docs/community/SCAFFOLD.md

Handle: ${handle}
Branch: ${branchName}
Writes ONLY under: public/community/${handle}/**
Required: public/community/${handle}/index.html and manifest.json

Implement the approved plan as static output (commit built assets). Wipe prior built files in this handle folder when replacing.

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
