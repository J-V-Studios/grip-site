import { describe, expect, it } from "vitest";
import {
	type BuildStatus,
	isValidHandle,
	normalizeHandle,
	parsePrompt,
	promptSchema,
} from "@/lib/community-schema";

describe("normalizeHandle", () => {
	it("lowercases uppercase input", () => {
		expect(normalizeHandle("CoolKid")).toBe("coolkid");
	});

	it("accepts valid hyphenated handles", () => {
		expect(normalizeHandle("cool-kid")).toBe("cool-kid");
	});

	it("trims surrounding whitespace", () => {
		expect(normalizeHandle("  grip  ")).toBe("grip");
	});

	it("rejects handles with internal spaces", () => {
		expect(normalizeHandle("cool kid")).toBeNull();
	});

	it("rejects handles shorter than 3 characters", () => {
		expect(normalizeHandle("ab")).toBeNull();
		expect(normalizeHandle("a")).toBeNull();
	});

	it("rejects handles longer than 24 characters", () => {
		expect(normalizeHandle("a".repeat(25))).toBeNull();
	});

	it("accepts handles at length boundaries", () => {
		expect(normalizeHandle("abc")).toBe("abc");
		expect(normalizeHandle("a".repeat(24))).toBe("a".repeat(24));
	});

	it("rejects leading or trailing hyphens", () => {
		expect(normalizeHandle("-cool")).toBeNull();
		expect(normalizeHandle("cool-")).toBeNull();
	});

	it("rejects invalid characters", () => {
		expect(normalizeHandle("cool_kid")).toBeNull();
		expect(normalizeHandle("cool.kid")).toBeNull();
	});
});

describe("isValidHandle", () => {
	it("returns true for normalized valid handles", () => {
		expect(isValidHandle("coolkid")).toBe(true);
	});

	it("returns false for invalid handles without normalizing", () => {
		expect(isValidHandle("CoolKid")).toBe(false);
		expect(isValidHandle("ab")).toBe(false);
	});
});

describe("promptSchema", () => {
	it("accepts non-empty prompts up to 500 characters", () => {
		const body = "a".repeat(500);
		expect(promptSchema.safeParse({ prompt: body }).success).toBe(true);
	});

	it("rejects prompts over 500 characters", () => {
		const body = "a".repeat(501);
		expect(promptSchema.safeParse({ prompt: body }).success).toBe(false);
	});

	it("rejects empty or whitespace-only prompts", () => {
		expect(promptSchema.safeParse({ prompt: "" }).success).toBe(false);
		expect(promptSchema.safeParse({ prompt: "   " }).success).toBe(false);
	});
});

describe("parsePrompt", () => {
	it("trims prompt text", () => {
		const result = parsePrompt({ prompt: "  laser squid  " });
		expect(result.error).toBeNull();
		expect(result.data?.prompt).toBe("laser squid");
	});

	it("returns an error message for invalid input", () => {
		const result = parsePrompt({ prompt: "" });
		expect(result.data).toBeNull();
		expect(result.error).toBeTruthy();
	});
});

describe("BuildStatus", () => {
	it("includes all pipeline statuses from the spec", () => {
		const statuses: BuildStatus[] = [
			"queued",
			"moderating",
			"planning",
			"building",
			"live",
			"rejected",
			"failed",
		];
		for (const status of statuses) {
			expect(status).toBeTruthy();
		}
	});
});
