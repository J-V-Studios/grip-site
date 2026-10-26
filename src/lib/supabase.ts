import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
	if (client) return client;

	const url = import.meta.env.PUBLIC_SUPABASE_URL;
	const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !key) {
		throw new Error(
			"Missing Supabase configuration. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY (see .env.example).",
		);
	}

	client = createClient(url, key);
	return client;
}
