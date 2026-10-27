import { getSupabase } from "@/lib/supabase";

export type CommunityGalleryItem = {
	handle: string;
	title: string | null;
	blurb: string | null;
	updatedAt: string;
};

const VIEW = "community_gallery";

type GalleryRow = {
	handle: string;
	title: string | null;
	blurb: string | null;
	updated_at: string;
};

function mapGalleryRow(row: GalleryRow): CommunityGalleryItem {
	return {
		handle: row.handle,
		title: row.title,
		blurb: row.blurb,
		updatedAt: row.updated_at,
	};
}

export async function fetchLiveCommunityPages(): Promise<
	CommunityGalleryItem[]
> {
	try {
		const { data, error } = await getSupabase()
			.from(VIEW)
			.select("handle,title,blurb,updated_at")
			.order("updated_at", { ascending: false });

		if (error) throw error;
		return (data ?? []).map((row) => mapGalleryRow(row as GalleryRow));
	} catch (error) {
		if (error instanceof Error) throw error;
		throw new Error("community gallery could not load");
	}
}
