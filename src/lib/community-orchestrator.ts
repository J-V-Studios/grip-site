import type { BuildStatus } from "@/lib/community-schema";

export type OrchestratorStatus = {
	buildId: string;
	handle: string;
	status: BuildStatus;
	title: string | null;
	blurb: string | null;
	error: string | null;
	moderationNotes: string | null;
	createdAt: string;
	updatedAt: string;
};

const IN_FLIGHT: BuildStatus[] = [
	"queued",
	"moderating",
	"planning",
	"building",
];

export function isInFlightStatus(status: BuildStatus): boolean {
	return IN_FLIGHT.includes(status);
}

export function resolveOrchestratorUrl(): string | null {
	const raw = import.meta.env.PUBLIC_COMMUNITY_ORCHESTRATOR_URL?.trim();
	if (!raw || raw.includes("YOUR_PROJECT")) {
		return null;
	}
	return raw.replace(/\/$/, "");
}

function orchestratorHeaders(): HeadersInit {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
	if (anon && !anon.includes("your_publishable")) {
		// Publishable keys (`sb_publishable_…`) are not JWTs — only send them on `apikey`.
		// Legacy anon JWTs may also go on Authorization for older gateways.
		headers.apikey = anon;
		if (anon.startsWith("eyJ")) {
			headers.Authorization = `Bearer ${anon}`;
		}
	}
	return headers;
}

async function parseJson<T>(
	response: Response,
): Promise<T & { error?: string }> {
	const data = (await response.json()) as T & { error?: string };
	if (!response.ok) {
		const message =
			data.error ??
			(response.status === 429
				? "daily limit reached (one enqueue per handle per UTC day)"
				: "request failed");
		throw new Error(message);
	}
	return data;
}

export async function claimHandle(
	orchestratorUrl: string,
	handle: string,
): Promise<{ handle: string; editCode: string }> {
	const response = await fetch(orchestratorUrl, {
		method: "POST",
		headers: orchestratorHeaders(),
		body: JSON.stringify({ action: "claim", handle }),
	});
	return parseJson(response);
}

export async function enqueueBuild(
	orchestratorUrl: string,
	input: { handle: string; editCode: string; prompt: string },
): Promise<{ buildId: string; status: BuildStatus }> {
	const response = await fetch(orchestratorUrl, {
		method: "POST",
		headers: orchestratorHeaders(),
		body: JSON.stringify({
			action: "enqueue",
			handle: input.handle,
			editCode: input.editCode,
			prompt: input.prompt,
		}),
	});
	return parseJson(response);
}

export async function fetchBuildStatus(
	orchestratorUrl: string,
	buildId: string,
): Promise<OrchestratorStatus> {
	const url = `${orchestratorUrl}?action=status&buildId=${encodeURIComponent(buildId)}`;
	const response = await fetch(url, {
		method: "GET",
		headers: orchestratorHeaders(),
	});
	return parseJson(response);
}
