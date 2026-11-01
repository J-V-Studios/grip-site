import { parseHeyInput } from "@/lib/hey-schema";
import { extFor } from "@/lib/sightings";
import { getSupabase } from "@/lib/supabase";
import { clean } from "@/lib/text";

export type Note = {
	id: string;
	name: string;
	body: string;
	photo_path: string | null;
};

const TABLE = "lilgrip_comments";
const BUCKET = "grip-heys";

/** Cap anonymous hey photo uploads (matches bucket file_size_limit). */
export const HEY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const HEY_IMAGE_MIME = new Set([
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
	"image/heic",
	"image/heif",
]);

export function validateHeyImage(file: File): string | null {
	const allowedExt = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);
	const fromName = (file.name.split(".").pop() || "").toLowerCase();
	const mimeOk = Boolean(file.type) && HEY_IMAGE_MIME.has(file.type);
	const extOk = allowedExt.has(fromName);
	if (!mimeOk && !extOk) {
		return "photo must be jpg, png, webp, or heic";
	}
	if (file.size <= 0) return "photo is empty";
	if (file.size > HEY_IMAGE_MAX_BYTES) {
		return "photo is too big (max 5MB)";
	}
	return null;
}

export function publicHeyPhotoUrl(path: string): string {
	return getSupabase().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadHeyPhoto(
	file: File,
): Promise<{ path: string | null; error: string | null }> {
	const invalid = validateHeyImage(file);
	if (invalid) return { path: null, error: invalid };

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

export async function fetchNotes(): Promise<Note[]> {
	try {
		const { data, error } = await getSupabase()
			.from(TABLE)
			.select("id,name,body,photo_path")
			.order("created_at", { ascending: false })
			.limit(40);

		if (error) throw error;
		return (data ?? []).map((row) => ({
			id: String(row.id),
			name: String(row.name),
			body: String(row.body ?? ""),
			photo_path:
				typeof row.photo_path === "string" && row.photo_path.length > 0
					? row.photo_path
					: null,
		}));
	} catch (error) {
		if (error instanceof Error) throw error;
		throw new Error("heys could not load");
	}
}

export async function insertNote(input: {
	name: string;
	body: string;
	photo?: File | null;
}): Promise<{ note: Note | null; error: string | null }> {
	const hasPhoto = Boolean(input.photo && input.photo.size > 0);
	const parsed = parseHeyInput(
		{ name: input.name, body: input.body },
		{ allowEmptyBody: hasPhoto },
	);
	if (!parsed.data) {
		return { note: null, error: parsed.error ?? "invalid hey" };
	}

	const body = clean(parsed.data.body, 200);
	const name = clean(parsed.data.name, 24) || "anon";

	if (!body && !hasPhoto) {
		return { note: null, error: "note body is empty" };
	}

	let photo_path: string | null = null;
	if (hasPhoto && input.photo) {
		const uploaded = await uploadHeyPhoto(input.photo);
		if (uploaded.error || !uploaded.path) {
			return { note: null, error: uploaded.error ?? "photo upload failed" };
		}
		photo_path = uploaded.path;
	}

	try {
		const { data, error } = await getSupabase()
			.from(TABLE)
			.insert({ name, body: body || "📷", photo_path })
			.select("id,name,body,photo_path")
			.single();

		if (error) return { note: null, error: error.message };
		return {
			note: {
				id: String(data.id),
				name: String(data.name),
				body: String(data.body ?? ""),
				photo_path:
					typeof data.photo_path === "string" && data.photo_path.length > 0
						? data.photo_path
						: null,
			},
			error: null,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "that hey bounced";
		return { note: null, error: message };
	}
}
