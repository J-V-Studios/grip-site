import { z } from "zod";

/** Slug handle: 3–24 chars, lowercase alphanumeric with internal hyphens. */
export const HANDLE_REGEX = /^[a-z0-9]([a-z0-9-]{1,22}[a-z0-9])?$/;

export const buildStatusSchema = z.enum([
	"queued",
	"moderating",
	"planning",
	"building",
	"live",
	"rejected",
	"failed",
]);

export type BuildStatus = z.infer<typeof buildStatusSchema>;

export function isValidHandle(handle: string): boolean {
	return HANDLE_REGEX.test(handle);
}

export function normalizeHandle(input: string): string | null {
	const trimmed = input.trim();
	if (trimmed.length === 0) {
		return null;
	}
	if (/\s/.test(trimmed)) {
		return null;
	}
	const slug = trimmed.toLowerCase();
	if (slug.length < 3 || slug.length > 24) {
		return null;
	}
	if (!isValidHandle(slug)) {
		return null;
	}
	return slug;
}

export const promptSchema = z.object({
	prompt: z
		.string()
		.trim()
		.min(1, "prompt is empty")
		.max(500, "prompt is too long"),
});

export type PromptInput = z.infer<typeof promptSchema>;

export function parsePrompt(input: unknown): {
	data: PromptInput | null;
	error: string | null;
} {
	const result = promptSchema.safeParse(input);
	if (!result.success) {
		return {
			data: null,
			error: result.error.issues[0]?.message ?? "invalid prompt",
		};
	}
	return { data: result.data, error: null };
}
