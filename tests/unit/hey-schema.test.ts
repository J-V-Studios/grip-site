import { describe, expect, it } from "vitest";
import { parseHeyInput } from "@/lib/hey-schema";

describe("parseHeyInput", () => {
	it("defaults empty name to anon", () => {
		const result = parseHeyInput({ name: "  ", body: "yo" });
		expect(result.error).toBeNull();
		expect(result.data).toEqual({ name: "anon", body: "yo" });
	});

	it("rejects empty body", () => {
		const result = parseHeyInput({ name: "grip", body: "   " });
		expect(result.data).toBeNull();
		expect(result.error).toMatch(/empty/i);
	});

	it("keeps a provided name", () => {
		const result = parseHeyInput({ name: "josiah", body: "slay" });
		expect(result.data).toEqual({ name: "josiah", body: "slay" });
	});
});
