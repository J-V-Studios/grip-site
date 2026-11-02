import { describe, expect, it } from "vitest";
import {
	cooldownRemainingMs,
	dhashFromImageData,
	formatCooldown,
	hammingDistanceHex,
	isNearDuplicateDhash,
	SIGHTING_COOLDOWN_MINUTES,
} from "@/lib/sighting-scan";

function solidImageData(
	width: number,
	height: number,
	rgb: [number, number, number],
): { width: number; height: number; data: Uint8ClampedArray } {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let i = 0; i < width * height; i += 1) {
		const o = i * 4;
		data[o] = rgb[0];
		data[o + 1] = rgb[1];
		data[o + 2] = rgb[2];
		data[o + 3] = 255;
	}
	return { width, height, data };
}

function checkerImageData(
	width: number,
	height: number,
): { width: number; height: number; data: Uint8ClampedArray } {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const o = (y * width + x) * 4;
			const v = (x + y) % 2 === 0 ? 240 : 20;
			data[o] = v;
			data[o + 1] = v;
			data[o + 2] = v;
			data[o + 3] = 255;
		}
	}
	return { width, height, data };
}

describe("sighting-scan", () => {
	it("computes hamming distance", () => {
		expect(hammingDistanceHex("0".repeat(16), "0".repeat(16))).toBe(0);
		expect(hammingDistanceHex("0".repeat(16), "f".repeat(16))).toBe(64);
	});

	it("flags near-duplicate dhashes", () => {
		const a = "0123456789abcdef";
		const b = "0123456789abcdff"; // 4 bits flipped in last nibble pair-ish
		expect(isNearDuplicateDhash(a, [a])).toBe(true);
		expect(isNearDuplicateDhash(a, [b], 8)).toBe(true);
		expect(isNearDuplicateDhash(a, ["fedcba9876543210"], 5)).toBe(false);
	});

	it("hashes solid vs checker differently", () => {
		const solid = dhashFromImageData(solidImageData(9, 8, [40, 40, 40]));
		const checker = dhashFromImageData(checkerImageData(9, 8));
		expect(solid).toMatch(/^[0-9a-f]{16}$/);
		expect(checker).toMatch(/^[0-9a-f]{16}$/);
		expect(hammingDistanceHex(solid, checker)).toBeGreaterThan(0);
	});

	it("formats cooldown windows", () => {
		expect(SIGHTING_COOLDOWN_MINUTES).toBe(15);
		expect(formatCooldown(5_000)).toBe("5s");
		expect(formatCooldown(65_000)).toBe("1m 05s");
		const last = new Date(Date.now() - 60_000).toISOString();
		const remaining = cooldownRemainingMs(last, Date.now(), 15);
		expect(remaining).toBeGreaterThan(13 * 60_000);
		expect(remaining).toBeLessThanOrEqual(14 * 60_000);
		expect(cooldownRemainingMs(null)).toBe(0);
	});
});
