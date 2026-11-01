import { describe, expect, it } from "vitest";
import {
	hunterLabel,
	normalizeUsername,
	validatePassword,
	validateUsername,
} from "@/lib/auth";

describe("auth helpers", () => {
	it("normalizes usernames", () => {
		expect(normalizeUsername(" Grip Fan! ")).toBe("gripfan");
		expect(normalizeUsername("ok_name")).toBe("ok_name");
	});

	it("validates usernames", () => {
		expect(validateUsername("ab")).toMatch(/3/);
		expect(validateUsername("good_name")).toBeNull();
	});

	it("validates passwords", () => {
		expect(validatePassword("123")).toMatch(/6/);
		expect(validatePassword("secret1")).toBeNull();
	});

	it("builds hunter label", () => {
		expect(hunterLabel({ id: "1", username: "grip", display_name: "G" })).toBe(
			"grip",
		);
		expect(hunterLabel(null)).toBe("anon");
	});
});
