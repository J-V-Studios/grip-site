import {
	cooldownRemainingMs,
	dhashFromUrl,
	formatCooldown,
	GRIPSTER_REF_PATHS,
	SIGHTING_COOLDOWN_MINUTES,
	scanSightingPhoto,
} from "@/lib/sighting-scan";
import { getSupabase } from "@/lib/supabase";
import { clean } from "@/lib/text";

export {
	formatCooldown,
	SIGHTING_COOLDOWN_MINUTES,
} from "@/lib/sighting-scan";

export function aggregatePoints(
	rows: { hunter: string; points: number }[],
): Map<string, number> {
	const totals = new Map<string, number>();
	for (const row of rows) {
		totals.set(row.hunter, (totals.get(row.hunter) ?? 0) + row.points);
	}
	return totals;
}

export function rankedLeaders(
	rows: { hunter: string; points: number }[],
	limit = 10,
): { hunter: string; points: number }[] {
	return [...aggregatePoints(rows).entries()]
		.map(([hunter, points]) => ({ hunter, points }))
		.sort((a, b) => b.points - a.points || a.hunter.localeCompare(b.hunter))
		.slice(0, limit);
}

export function extFor(file: { name: string; type: string }): string {
	const fromName = (file.name.split(".").pop() || "").toLowerCase();
	if (["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(fromName)) {
		return fromName === "jpeg" ? "jpg" : fromName;
	}
	const map: Record<string, string> = {
		"image/jpeg": "jpg",
		"image/jpg": "jpg",
		"image/png": "png",
		"image/webp": "webp",
		"image/heic": "heic",
		"image/heif": "heif",
	};
	return map[file.type] || "jpg";
}

/** Bucket-safe Content-Type (phones often send empty or image/jpg). */
export function contentTypeFor(file: { name: string; type: string }): string {
	const raw = (file.type || "").toLowerCase();
	if (raw === "image/jpg") return "image/jpeg";
	if (
		raw === "image/jpeg" ||
		raw === "image/png" ||
		raw === "image/webp" ||
		raw === "image/heic" ||
		raw === "image/heif"
	) {
		return raw;
	}
	const ext = extFor(file);
	const map: Record<string, string> = {
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		webp: "image/webp",
		heic: "image/heic",
		heif: "image/heif",
	};
	return map[ext] || "image/jpeg";
}

export type Sighting = {
	id: string;
	hunter: string;
	place: string;
	photo_path: string;
	points: number;
	created_at: string;
	user_id?: string | null;
};

export type LeaderEntry = {
	user_id: string;
	hunter: string;
	points: number;
	sightings: number;
};

export const POINTS_PER_SIGHTING = 10;
export const SIGHTING_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const REPORTS_TO_HIDE = 2;

const TABLE = "grip_sightings";
const BUCKET = "grip-sightings";
const REPORTER_KEY = "lilgrip-reporter";

const SIGHTING_MIME = new Set([
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
	"image/heic",
	"image/heif",
]);

export function validateSightingImage(file: File): string | null {
	const allowedExt = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);
	const fromName = (file.name.split(".").pop() || "").toLowerCase();
	const mimeOk = Boolean(file.type) && SIGHTING_MIME.has(file.type);
	const extOk = allowedExt.has(fromName);
	if (!mimeOk && !extOk) {
		return "photo must be jpg, png, webp, or heic";
	}
	if (file.size <= 0) return "photo is empty";
	if (file.size > SIGHTING_IMAGE_MAX_BYTES) {
		return "keep the photo under 5MB";
	}
	return null;
}

export function getReporterKey(): string {
	try {
		const existing = localStorage.getItem(REPORTER_KEY);
		if (existing && existing.length >= 8) return existing.slice(0, 64);
		const next = `r-${crypto.randomUUID().replace(/-/g, "")}`;
		localStorage.setItem(REPORTER_KEY, next);
		return next;
	} catch {
		return `r-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
	}
}

export async function fetchSightings(): Promise<Sighting[]> {
	const { data, error } = await getSupabase()
		.from(TABLE)
		.select("id,hunter,place,photo_path,points,created_at,user_id")
		.eq("is_hidden", false)
		.order("created_at", { ascending: false })
		.limit(24);

	if (error) throw error;
	return (data ?? []) as Sighting[];
}

export async function fetchLeaderboard(limit = 10): Promise<LeaderEntry[]> {
	const { data, error } = await getSupabase().rpc("grip_points_leaderboard", {
		p_limit: limit,
	});
	if (error) throw error;
	return (
		(data ?? []) as {
			user_id: string;
			hunter: string;
			points: number | string;
			sightings: number | string;
		}[]
	).map((row) => ({
		user_id: row.user_id,
		hunter: row.hunter,
		points: Number(row.points) || 0,
		sightings: Number(row.sightings) || 0,
	}));
}

export function publicPhotoUrl(path: string): string {
	return getSupabase().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadSightingPhoto(
	file: File,
): Promise<{ path: string | null; error: string | null }> {
	const invalid = validateSightingImage(file);
	if (invalid) return { path: null, error: invalid };

	const contentType = contentTypeFor(file);
	const storagePath = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${extFor(file)}`;

	// Re-wrap when browsers omit MIME — storage bucket rejects empty Content-Type.
	const body =
		file.type && file.type === contentType
			? file
			: new Blob([await file.arrayBuffer()], { type: contentType });

	const { error } = await getSupabase()
		.storage.from(BUCKET)
		.upload(storagePath, body, {
			cacheControl: "3600",
			contentType,
			upsert: false,
		});

	if (error) return { path: null, error: error.message };
	return { path: storagePath, error: null };
}

export async function fetchSightingFingerprints(): Promise<{
	sha256: string[];
	dhashes: string[];
}> {
	const { data, error } = await getSupabase().rpc(
		"grip_sighting_fingerprints",
		{
			p_limit: 80,
		},
	);
	if (error) throw error;
	const sha256: string[] = [];
	const dhashes: string[] = [];
	for (const row of (data ?? []) as {
		photo_sha256: string | null;
		photo_dhash: string | null;
	}[]) {
		if (row.photo_sha256) sha256.push(row.photo_sha256);
		if (row.photo_dhash) dhashes.push(row.photo_dhash);
	}
	return { sha256, dhashes };
}

let siteDhashCache: string[] | null = null;

export async function fetchSiteGripsterDhashes(): Promise<string[]> {
	if (siteDhashCache) return siteDhashCache;
	const hashes: string[] = [];
	for (const path of GRIPSTER_REF_PATHS) {
		const hash = await dhashFromUrl(path);
		if (hash) hashes.push(hash);
	}
	siteDhashCache = hashes;
	return hashes;
}

export async function fetchMyLastSightingAt(
	userId: string,
): Promise<string | null> {
	const { data, error } = await getSupabase()
		.from(TABLE)
		.select("created_at")
		.eq("user_id", userId)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();
	if (error) throw error;
	return data?.created_at ?? null;
}

export async function checkSightingCooldown(
	userId: string,
): Promise<{ ok: true } | { ok: false; error: string; retryAfterMs: number }> {
	const last = await fetchMyLastSightingAt(userId);
	const remaining = cooldownRemainingMs(last);
	if (remaining > 0) {
		return {
			ok: false,
			retryAfterMs: remaining,
			error: `cooldown — wait ${formatCooldown(remaining)} before another sighting`,
		};
	}
	return { ok: true };
}

/** Scan + cooldown + dedupe gates before upload. */
export async function preflightSightingPhoto(
	file: File,
	userId: string,
): Promise<
	| {
			ok: true;
			sha256: string;
			dhash: string | null;
	  }
	| { ok: false; error: string }
> {
	const cool = await checkSightingCooldown(userId);
	if (!cool.ok) return { ok: false, error: cool.error };

	const [prints, siteDhashes] = await Promise.all([
		fetchSightingFingerprints(),
		fetchSiteGripsterDhashes(),
	]);

	const scanned = await scanSightingPhoto({
		file,
		knownSha256: prints.sha256,
		knownDhashes: prints.dhashes,
		siteDhashes,
	});

	if (!scanned.ok) return scanned;
	return {
		ok: true,
		sha256: scanned.sha256,
		dhash: scanned.dhash,
	};
}

export async function insertSighting(input: {
	hunter: string;
	place: string;
	photo_path: string;
	points?: number;
	user_id: string;
	photo_sha256: string;
	photo_dhash?: string | null;
}): Promise<{ error: string | null }> {
	const hunter = clean(input.hunter, 24) || "anon";
	const place = clean(input.place, 80);
	const points = input.points ?? POINTS_PER_SIGHTING;

	if (!input.user_id) {
		return { error: "sign in to log a sighting" };
	}
	if (!input.photo_sha256) {
		return { error: "photo scan incomplete — try another image" };
	}

	const { data, error } = await getSupabase().rpc("submit_grip_sighting", {
		p_hunter: hunter,
		p_place: place,
		p_photo_path: input.photo_path,
		p_photo_sha256: input.photo_sha256,
		p_photo_dhash: input.photo_dhash ?? null,
		p_points: points,
		p_cooldown_minutes: SIGHTING_COOLDOWN_MINUTES,
	});

	if (error) return { error: error.message };

	const payload = (data ?? {}) as { ok?: boolean; error?: string };
	if (payload.ok === false) {
		return { error: payload.error ?? "sighting did not save" };
	}
	return { error: null };
}

export type ReportSightingResult = {
	ok: boolean;
	reportCount?: number;
	hidden?: boolean;
	error?: string;
};

/** Flag a photo as not the lilgriper. Two distinct reporters hide it and zero points. */
export async function reportNotGripster(
	sightingId: string,
	reporterKey = getReporterKey(),
): Promise<ReportSightingResult> {
	const { data, error } = await getSupabase().rpc("report_grip_sighting", {
		p_sighting_id: sightingId,
		p_reporter_key: reporterKey,
		p_reason: "not_gripster",
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	const payload = (data ?? {}) as {
		ok?: boolean;
		reportCount?: number;
		hidden?: boolean;
		error?: string;
	};

	if (payload.ok === false) {
		return { ok: false, error: payload.error ?? "report failed" };
	}

	return {
		ok: true,
		reportCount: payload.reportCount ?? 0,
		hidden: Boolean(payload.hidden),
	};
}
