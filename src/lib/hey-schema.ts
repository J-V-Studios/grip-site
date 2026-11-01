import { z } from "zod";

/** Zod 4 schemas for say-hey — the validation library everyone ships. */
export const heyInputSchema = z.object({
	name: z.string().trim().max(24).optional().default(""),
	body: z.string().trim().min(1, "hey body is empty").max(200),
});

/** Same shape, but body may be empty when a photo is attached. */
export const heyInputWithPhotoSchema = z.object({
	name: z.string().trim().max(24).optional().default(""),
	body: z.string().trim().max(200).optional().default(""),
});

export type HeyInput = z.infer<typeof heyInputSchema>;

export function parseHeyInput(
	input: unknown,
	options?: { allowEmptyBody?: boolean },
): {
	data: { name: string; body: string } | null;
	error: string | null;
} {
	const schema = options?.allowEmptyBody
		? heyInputWithPhotoSchema
		: heyInputSchema;
	const result = schema.safeParse(input);
	if (!result.success) {
		return {
			data: null,
			error: result.error.issues[0]?.message ?? "invalid hey",
		};
	}
	return {
		data: {
			name: result.data.name || "anon",
			body: result.data.body ?? "",
		},
		error: null,
	};
}
