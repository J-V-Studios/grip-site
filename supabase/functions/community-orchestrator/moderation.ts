/**
 * Keep in sync with `src/lib/community-moderation.ts` (Deno edge runtime cannot import app src).
 */

export type ModerationResult =
	| { ok: true }
	| { ok: false; reason: string; notes: string };

/** Substrings that indicate block-worthy content (lowercase match). */
const BLOCK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
	{
		pattern:
			/\b(kill|murder|shoot|stab|hurt|harm|attack)\s+(people|person|humans|someone|classmates|students|kids)\b/i,
		reason: "real-world harm to people",
	},
	{
		pattern:
			/\b(how\s+to|guide\s+to|instructions?\s+to)\s+(kill|hurt|harm|murder)\b/i,
		reason: "harm instructions",
	},
	{
		pattern: /\b(child\s*porn|cp\b|underage\s+sex)/i,
		reason: "CSAM",
	},
	{
		pattern:
			/\b(steal|exfiltrat|phish|malware|keylog|ransomware|credential\s*theft)\b/i,
		reason: "scams or malware",
	},
	{
		pattern:
			/\b(doxx|dox\s|ssn|social\s+security\s+number|leak\s+their\s+address)\b/i,
		reason: "doxxing / personal data",
	},
	{
		pattern: /\bsrc\/pages\/|src\/components\/|astro\.config/i,
		reason: "sandbox escape (core src/)",
	},
	{
		pattern: /\.github\/|\.env\b|CURSOR_API_KEY|SERVICE_ROLE/i,
		reason: "secrets or CI escape",
	},
	{
		pattern: /\b(seo\s+farm|buy\s+backlinks|casino\s+spam)\b/i,
		reason: "spam / SEO junk",
	},
];

/** Very coarse hate slur detector — extend with care; blocks obvious abuse. */
const HATE_SLUR_PATTERN =
	/\b(n[i1]gg|f[a4]gg|k[i1]ke|ch[i1]nk|sp[i1]c|tr[a4]nn(y|ie))\b/i;

export function moderateText(text: string): ModerationResult {
	const normalized = text.replace(/\s+/g, " ").trim();
	if (normalized.length === 0) {
		return { ok: false, reason: "empty", notes: "Prompt is empty." };
	}

	if (HATE_SLUR_PATTERN.test(normalized)) {
		return {
			ok: false,
			reason: "hate",
			notes: "Hate or slurs are not allowed.",
		};
	}

	for (const { pattern, reason } of BLOCK_PATTERNS) {
		if (pattern.test(normalized)) {
			return {
				ok: false,
				reason,
				notes: `Blocked: ${reason}.`,
			};
		}
	}

	if (/\boverwrite\s+public\/community\//i.test(normalized)) {
		return {
			ok: false,
			reason: "sandbox escape",
			notes: "Cannot modify other community folders.",
		};
	}

	return { ok: true };
}

export const REJECTED_USER_MESSAGE =
	"That idea didn't pass the vibe check. Try something goofy and chill instead.";
