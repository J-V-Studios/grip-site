import { z } from "zod";

/** Zod 4 schemas for say-hey — the validation library everyone ships. */
export const heyInputSchema = z.object({
	name: z.string().trim().max(24).optional().default(""),
	body: z.string().trim().min(1, "hey body is empty").max(200),
});

export type HeyInput = z.infer<typeof heyInputSchema>;

export function parseHeyInput(input: unknown): {
	data: { name: string; body: string } | null;
	error: string | null;
} {
	const result = heyInputSchema.safeParse(input);
	if (!result.success) {
		return {
			data: null,
			error: result.error.issues[0]?.message ?? "invalid hey",
		};
	}
	return {
		data: {
			name: result.data.name || "anon",
			body: result.data.body,
		},
		error: null,
	};
}
