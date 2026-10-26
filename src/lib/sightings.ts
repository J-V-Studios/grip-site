import { getSupabase } from "@/lib/supabase";
import { clean } from "@/lib/text";

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

export type Sighting = {
	id: string;
	hunter: string;
	place: string;
	photo_path: string;
	points: number;
	created_at: string;
};

export const POINTS_PER_SIGHTING = 10;
const TABLE = "grip_sightings";
const BUCKET = "grip-sightings";

export async function fetchSightings(): Promise<Sighting[]> {
	const { data, error } = await getSupabase()
		.from(TABLE)
		.select("id,hunter,place,photo_path,points,created_at")
		.order("created_at", { ascending: false })
		.limit(24);

	if (error) throw error;
	return (data ?? []) as Sighting[];
}

export function publicPhotoUrl(path: string): string {
	return getSupabase().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadSightingPhoto(
	file: File,
): Promise<{ path: string | null; error: string | null }> {
	const storagePath = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${extFor(file)}`;

	const { error } = await getSupabase()
		.storage.from(BUCKET)
		.upload(storagePath, file, {
			cacheControl: "3600",
			contentType: file.type || "image/jpeg",
			upsert: false,
		});

	if (error) return { path: null, error: error.message };
	return { path: storagePath, error: null };
}

export async function insertSighting(input: {
	hunter: string;
	place: string;
	photo_path: string;
	points?: number;
}): Promise<{ error: string | null }> {
	const hunter = clean(input.hunter, 24) || "anon";
	const place = clean(input.place, 80);
	const points = input.points ?? POINTS_PER_SIGHTING;

	const { error } = await getSupabase().from(TABLE).insert({
		hunter,
		place,
		photo_path: input.photo_path,
		points,
	});

	if (error) return { error: error.message };
	return { error: null };
}
