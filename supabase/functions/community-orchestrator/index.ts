import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
	REJECTED_USER_MESSAGE,
	moderateText,
	type ModerationResult,
} from "./moderation.ts";
import { launchBuilderAgent, launchPlannerAgent } from "./cursor.ts";

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const HANDLE_REGEX = /^[a-z0-9]([a-z0-9-]{1,22}[a-z0-9])?$/;
const PROMPT_MAX = 500;

/** When EDIT_CODE_PEPPER is unset, still use a fixed domain separator (not secret — pepper adds entropy). */
const DEFAULT_EDIT_CODE_PEPPER = "lilgrip-community-edit-code-v1";

const ALLOWED_ORIGIN_PATTERNS = [
	/^https:\/\/(www\.)?lilgrip\.com$/i,
	/^http:\/\/localhost(:\d+)?$/i,
	/^http:\/\/127\.0\.0\.1(:\d+)?$/i,
];

function corsHeaders(origin: string | null): HeadersInit {
	const allowed =
		origin && ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin))
			? origin
			: "https://lilgrip.com";
	return {
		"Access-Control-Allow-Origin": allowed,
		"Access-Control-Allow-Headers":
			"authorization, x-client-info, apikey, content-type",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	};
}

/**
 * Gateway `verify_jwt` is off so publishable (`sb_publishable_…`) keys work.
 * Authorize callers by matching the `apikey` header to project anon/publishable keys.
 */
function collectAllowedApiKeys(): Set<string> {
	const allowed = new Set<string>();
	const anon = Deno.env.get("SUPABASE_ANON_KEY");
	if (anon) allowed.add(anon);

	const publishableJson = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
	if (publishableJson) {
		try {
			const parsed = JSON.parse(publishableJson) as Record<string, unknown>;
			for (const value of Object.values(parsed)) {
				if (typeof value === "string" && value.length > 0) {
					allowed.add(value);
				}
			}
		} catch {
			// ignore malformed env
		}
	}
	return allowed;
}

function unauthorized(origin: string | null): Response {
	return json({ error: "unauthorized" }, 401, origin);
}

function assertApiKey(
	req: Request,
	origin: string | null,
): Response | null {
	const key = req.headers.get("apikey")?.trim() ?? "";
	if (!key) return unauthorized(origin);
	const allowed = collectAllowedApiKeys();
	// If platform keys are missing (local smoke), allow any non-empty key only when empty set
	// would lock us out — require at least one configured key in production.
	if (allowed.size === 0) {
		console.error("No SUPABASE_ANON_KEY / SUPABASE_PUBLISHABLE_KEYS configured");
		return json({ error: "server misconfigured" }, 500, origin);
	}
	if (!allowed.has(key)) return unauthorized(origin);
	return null;
}

function json(
	body: unknown,
	status = 200,
	origin: string | null = null,
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
	});
}

function normalizeHandle(input: string): string | null {
	const trimmed = input.trim();
	if (!trimmed || /\s/.test(trimmed)) return null;
	const slug = trimmed.toLowerCase();
	if (slug.length < 3 || slug.length > 24) return null;
	if (!HANDLE_REGEX.test(slug)) return null;
	return slug;
}

function sanitizePrompt(raw: string): string {
	return raw
		.replace(/[\u0000-\u001f\u007f]/g, "")
		.trim()
		.slice(0, PROMPT_MAX);
}

async function hashEditCode(plain: string): Promise<string> {
	const pepper = Deno.env.get("EDIT_CODE_PEPPER") ?? DEFAULT_EDIT_CODE_PEPPER;
	const data = new TextEncoder().encode(`${pepper}:${plain}`);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function generateEditCode(): string {
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);
	const alphabet =
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let out = "";
	for (const b of bytes) {
		out += alphabet[b % alphabet.length];
	}
	return out;
}

function utcDayStart(d = new Date()): string {
	return d.toISOString().slice(0, 10);
}

function elaborateBrief(handle: string, prompt: string): string {
	return `# Community mini-page brief

**Handle:** ${handle}
**Site:** lilgrip.com/community/${handle}/

## Visitor idea
${prompt}

## Constraints
- Static output only under \`public/community/${handle}/\`
- Include \`manifest.json\` (title, blurb, builtAt)
- Goofy, chill, mobile-friendly; respect MODERATION.md
- Optional Vite/React in \`_src/\` with built assets in handle root

## Deliverables
- \`index.html\` + assets
- Gallery title and one-line blurb in manifest
`;
}

function serviceClient() {
	const url = Deno.env.get("SUPABASE_URL");
	const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
	if (!url || !key) {
		throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured");
	}
	return createClient(url, key, { auth: { persistSession: false } });
}

function repoUrl(): string {
	return (
		Deno.env.get("COMMUNITY_REPO_URL") ??
		"https://github.com/J-V-Studios/grip-site"
	);
}

async function handleClaim(
	body: Record<string, unknown>,
	origin: string | null,
): Promise<Response> {
	const handle = normalizeHandle(String(body.handle ?? ""));
	if (!handle) {
		return json({ error: "invalid handle" }, 400, origin);
	}

	const supabase = serviceClient();
	const { data: existing } = await supabase
		.from("community_creators")
		.select("handle")
		.eq("handle", handle)
		.maybeSingle();

	if (existing) {
		return json({ error: "handle already claimed" }, 409, origin);
	}

	const editCode = generateEditCode();
	const edit_code_hash = await hashEditCode(editCode);

	const { error } = await supabase.from("community_creators").insert({
		handle,
		edit_code_hash,
	});

	if (error) {
		return json({ error: error.message }, 500, origin);
	}

	return json({ handle, editCode }, 201, origin);
}

async function verifyEditCode(
	handle: string,
	editCode: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
	const supabase = serviceClient();
	const { data: creator, error } = await supabase
		.from("community_creators")
		.select("edit_code_hash, is_banned")
		.eq("handle", handle)
		.maybeSingle();

	if (error || !creator) {
		return { ok: false, status: 404, error: "unknown handle" };
	}
	if (creator.is_banned) {
		return { ok: false, status: 403, error: "handle is banned" };
	}

	const hash = await hashEditCode(editCode);
	if (hash !== creator.edit_code_hash) {
		return { ok: false, status: 401, error: "invalid edit code" };
	}
	return { ok: true };
}

async function hasEnqueueToday(handle: string): Promise<boolean> {
	const supabase = serviceClient();
	const day = utcDayStart();
	const start = `${day}T00:00:00.000Z`;
	const end = `${day}T23:59:59.999Z`;

	const { count, error } = await supabase
		.from("community_builds")
		.select("id", { count: "exact", head: true })
		.eq("handle", handle)
		.gte("created_at", start)
		.lte("created_at", end);

	if (error) {
		throw new Error(error.message);
	}
	return (count ?? 0) > 0;
}

async function runPipeline(buildId: string, handle: string, prompt: string) {
	const supabase = serviceClient();

	const setBuild = async (patch: Record<string, unknown>) => {
		await supabase.from("community_builds").update(patch).eq("id", buildId);
	};

	await setBuild({ status: "moderating" });

	const mod: ModerationResult = moderateText(prompt);
	if (!mod.ok) {
		await setBuild({
			status: "rejected",
			moderation_notes: mod.notes,
			error: REJECTED_USER_MESSAGE,
		});
		return;
	}

	const brief = elaborateBrief(handle, prompt);
	await setBuild({ elaborated_brief: brief, status: "planning" });

	const apiKey = Deno.env.get("CURSOR_API_KEY")?.trim();
	if (!apiKey) {
		await setBuild({
			status: "failed",
			error: "CURSOR_API_KEY not configured",
		});
		return;
	}

	const shortId = buildId.replace(/-/g, "").slice(0, 8);
	const branchName = `community/${handle}-${shortId}`;

	const planner = await launchPlannerAgent(
		apiKey,
		repoUrl(),
		handle,
		brief,
	);
	if (!planner.ok) {
		await setBuild({
			status: "failed",
			error: planner.error,
			branch_name: branchName,
		});
		return;
	}

	await setBuild({
		agent_plan_id: planner.agentId,
		branch_name: branchName,
		status: "building",
	});

	const builder = await launchBuilderAgent(
		apiKey,
		repoUrl(),
		handle,
		brief,
		branchName,
	);
	if (!builder.ok) {
		await setBuild({
			status: "failed",
			error: builder.error,
			agent_build_id: null,
		});
		return;
	}

	await setBuild({
		agent_build_id: builder.agentId,
		status: "building",
	});

	// last_build_at updated when build goes live (CI/orchestrator follow-up)
}

async function handleEnqueue(
	body: Record<string, unknown>,
	origin: string | null,
): Promise<Response> {
	const handle = normalizeHandle(String(body.handle ?? ""));
	if (!handle) {
		return json({ error: "invalid handle" }, 400, origin);
	}

	const editCode = String(body.editCode ?? "");
	if (editCode.length < 8) {
		return json({ error: "invalid edit code" }, 400, origin);
	}

	const prompt = sanitizePrompt(String(body.prompt ?? ""));
	if (!prompt) {
		return json({ error: "prompt is empty" }, 400, origin);
	}

	const verified = await verifyEditCode(handle, editCode);
	if (!verified.ok) {
		return json({ error: verified.error }, verified.status, origin);
	}

	try {
		if (await hasEnqueueToday(handle)) {
			return json(
				{
					error: "daily limit reached (one enqueue per handle per UTC day)",
				},
				429,
				origin,
			);
		}
	} catch (e) {
		return json(
			{ error: e instanceof Error ? e.message : "rate check failed" },
			500,
			origin,
		);
	}

	const supabase = serviceClient();
	const { data: row, error } = await supabase
		.from("community_builds")
		.insert({
			handle,
			status: "queued",
			prompt,
		})
		.select("id, status")
		.single();

	if (error || !row) {
		return json({ error: error?.message ?? "insert failed" }, 500, origin);
	}

	const buildId = row.id as string;

	// @ts-expect-error EdgeRuntime is injected in Supabase edge
	const edgeRuntime = typeof EdgeRuntime !== "undefined" ? EdgeRuntime : null;
	if (edgeRuntime?.waitUntil) {
		edgeRuntime.waitUntil(runPipeline(buildId, handle, prompt));
	} else {
		runPipeline(buildId, handle, prompt).catch((err) =>
			console.error("pipeline error", err),
		);
	}

	return json({ buildId, status: row.status }, 202, origin);
}

async function handleStatus(
	buildId: string,
	origin: string | null,
): Promise<Response> {
	if (!buildId || !/^[0-9a-f-]{36}$/i.test(buildId)) {
		return json({ error: "invalid buildId" }, 400, origin);
	}

	const supabase = serviceClient();
	const { data, error } = await supabase
		.from("community_builds")
		.select(
			"id, handle, status, title, blurb, error, moderation_notes, created_at, updated_at",
		)
		.eq("id", buildId)
		.maybeSingle();

	if (error) {
		return json({ error: error.message }, 500, origin);
	}
	if (!data) {
		return json({ error: "not found" }, 404, origin);
	}

	const publicFields = {
		buildId: data.id,
		handle: data.handle,
		status: data.status,
		title: data.title,
		blurb: data.blurb,
		error: data.error,
		moderationNotes:
			data.status === "rejected" ? data.moderation_notes : null,
		createdAt: data.created_at,
		updatedAt: data.updated_at,
	};

	return json(publicFields, 200, origin);
}

Deno.serve(async (req) => {
	const origin = req.headers.get("Origin");

	if (req.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: corsHeaders(origin) });
	}

	const authError = assertApiKey(req, origin);
	if (authError) return authError;

	try {
		if (req.method === "GET") {
			const url = new URL(req.url);
			const action = url.searchParams.get("action");
			if (action === "status") {
				const buildId = url.searchParams.get("buildId") ?? "";
				return await handleStatus(buildId, origin);
			}
			return json({ error: "unknown action" }, 400, origin);
		}

		if (req.method === "POST") {
			let body: Record<string, unknown>;
			try {
				body = await req.json();
			} catch {
				return json({ error: "invalid JSON" }, 400, origin);
			}

			const action = body.action;
			if (action === "claim") {
				return await handleClaim(body, origin);
			}
			if (action === "enqueue") {
				return await handleEnqueue(body, origin);
			}
			return json({ error: "unknown action" }, 400, origin);
		}

		return json({ error: "method not allowed" }, 405, origin);
	} catch (e) {
		const message = e instanceof Error ? e.message : "internal error";
		return json({ error: message }, 500, origin);
	}
});
