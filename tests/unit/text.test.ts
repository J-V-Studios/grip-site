import { describe, expect, it } from "vitest";
import { clean } from "@/lib/text";

describe("clean", () => {
	it("trims, collapses spaces, and clamps length", () => {
		expect(clean("  hello   world  ", 8)).toBe("hello wo");
	});
});
