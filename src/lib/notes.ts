import { getSupabase } from "@/lib/supabase";
import { clean } from "@/lib/text";

export type Note = {
	id: string;
	name: string;
	body: string;
};

const TABLE = "lilgrip_comments";

export async function fetchNotes(): Promise<Note[]> {
	const { data, error } = await getSupabase()
		.from(TABLE)
		.select("id,name,body")
		.order("created_at", { ascending: false })
		.limit(40);

	if (error) throw error;
	return (data ?? []) as Note[];
}

export async function insertNote(input: {
	name: string;
	body: string;
}): Promise<{ note: Note | null; error: string | null }> {
	const body = clean(input.body, 200);
	if (!body) {
		return { note: null, error: "note body is empty" };
	}
	const name = clean(input.name, 24) || "anon";

	const { data, error } = await getSupabase()
		.from(TABLE)
		.insert({ name, body })
		.select("id,name,body")
		.single();

	if (error) return { note: null, error: error.message };
	return { note: data as Note, error: null };
}
