import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
	type CommunityGalleryItem,
	isPublicGalleryHandle,
} from "@/lib/community";

type ManifestJson = {
	handle?: string;
	title?: string;
	blurb?: string;
	builtAt?: string;
};

/**
 * Build-time gallery from shipped manifests under `public/community/<handle>/`.
 * Server/Astro only — do not import from client islands.
 */
export async function fetchGalleryFromDisk(
	communityRoot = path.join(process.cwd(), "public", "community"),
): Promise<CommunityGalleryItem[]> {
	let entries: string[];
	try {
		entries = await readdir(communityRoot, { withFileTypes: true }).then(
			(dirs) => dirs.filter((d) => d.isDirectory()).map((d) => d.name),
		);
	} catch {
		return [];
	}

	const items: CommunityGalleryItem[] = [];
	for (const handle of entries) {
		if (!isPublicGalleryHandle(handle)) continue;
		const manifestPath = path.join(communityRoot, handle, "manifest.json");
		try {
			const raw = await readFile(manifestPath, "utf8");
			const manifest = JSON.parse(raw) as ManifestJson;
			const publicHandle = manifest.handle?.trim() || handle;
			if (!isPublicGalleryHandle(publicHandle)) continue;
			items.push({
				handle: publicHandle,
				title: manifest.title?.trim() || null,
				blurb: manifest.blurb?.trim() || null,
				updatedAt: manifest.builtAt?.trim() || new Date(0).toISOString(),
			});
		} catch {
			// skip folders without a readable manifest
		}
	}

	return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
