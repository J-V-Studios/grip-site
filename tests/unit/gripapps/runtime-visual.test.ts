import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("gripapps runtime visual kit", () => {
	it("themes, hero bleed, emoji sprites, scene vibe/motion, reduced motion", async () => {
		const src = await readFile(
			path.join(process.cwd(), "public/gripapps/runtime.js"),
			"utf8",
		);
		for (const theme of [
			"neon_lagoon",
			"barn_night",
			"candy_arcade",
			"deep_space",
		]) {
			expect(src).toContain(theme + ":");
		}
		expect(src).toContain("grip-hero-bleed");
		expect(src).toMatch(/fillText|grip-sprite-emoji/);
		expect(src).toContain("prefersReducedMotion");
		expect(src).toContain("scene.vibe");
		expect(src).toMatch(/motion !== "none"|motion !== 'none'/);
	});
});
