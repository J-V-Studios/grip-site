/** Visitor-facing copy for stored orchestrator / Cursor agent failures. */
export function humanizeCommunityBuildError(
	raw: string | null | undefined,
): string {
	if (!raw) return "build failed";
	if (
		/usage_limit_exceeded|prepaid balance is used up|add funds|auto top-up/i.test(
			raw,
		)
	) {
		return "Cursor Cloud Agents billing is empty — add funds or enable auto top-up on the Cursor account that owns CURSOR_API_KEY, then try again (one enqueue per handle per UTC day).";
	}
	if (/Invalid User API Key/i.test(raw)) {
		return "Cursor API key rejected — check CURSOR_API_KEY in Supabase secrets.";
	}
	return raw;
}
