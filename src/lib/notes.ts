import { parseHeyInput } from "@/lib/hey-schema";
import { getSupabase } from "@/lib/supabase";
import { clean } from "@/lib/text";

export type Note = {
	id: string;
	name: string;
	body: string;
};

const TABLE = "lilgrip_comments";

export async function fetchNotes(): Promise<Note[]> {
	try {
		const { data, error } = await getSupabase()
			.from(TABLE)
			.select("id,name,body")
			.order("created_at", { ascending: false })
			.limit(40);

		if (error) throw error;
		return (data ?? []) as Note[];
	} catch (error) {
		if (error instanceof Error) throw error;
		throw new Error("heys could not load");
	}
}

export async function insertNote(input: {
	name: string;
	body: string;
}): Promise<{ note: Note | null; error: string | null }> {
	const parsed = parseHeyInput(input);
	if (!parsed.data) {
		return { note: null, error: parsed.error ?? "invalid hey" };
	}

	const body = clean(parsed.data.body, 200);
	if (!body) {
		return { note: null, error: "note body is empty" };
	}
	const name = clean(parsed.data.name, 24) || "anon";

	try {
		const { data, error } = await getSupabase()
			.from(TABLE)
			.insert({ name, body })
			.select("id,name,body")
			.single();

		if (error) return { note: null, error: error.message };
		return { note: data as Note, error: null };
	} catch (error) {
		const message = error instanceof Error ? error.message : "that hey bounced";
		return { note: null, error: message };
	}
}
