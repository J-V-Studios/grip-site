import { describe, expect, it } from "vitest";
import {
	aggregatePoints,
	extFor,
	REPORTS_TO_HIDE,
	rankedLeaders,
	SIGHTING_IMAGE_MAX_BYTES,
	validateSightingImage,
} from "@/lib/sightings";

function fakeFile(name: string, type: string, size: number): File {
	const blob = new Blob([new Uint8Array(Math.min(size, 64))], { type });
	const file = new File([blob], name, { type });
	Object.defineProperty(file, "size", { value: size });
	return file;
}

describe("sightings helpers", () => {
	it("aggregates points by hunter", () => {
		const map = aggregatePoints([
			{ hunter: "a", points: 10 },
			{ hunter: "b", points: 10 },
			{ hunter: "a", points: 10 },
		]);
		expect(map.get("a")).toBe(20);
	});

	it("ranks leaders descending", () => {
		const ranked = rankedLeaders([
			{ hunter: "a", points: 10 },
			{ hunter: "b", points: 30 },
		]);
		expect(ranked[0]).toEqual({ hunter: "b", points: 30 });
	});

	it("maps jpeg extension", () => {
		expect(extFor({ name: "x.JPEG", type: "image/jpeg" })).toBe("jpg");
	});

	it("validates sighting photos", () => {
		expect(
			validateSightingImage(fakeFile("g.jpg", "image/jpeg", 1000)),
		).toBeNull();
		expect(
			validateSightingImage(
				fakeFile("big.png", "image/png", SIGHTING_IMAGE_MAX_BYTES + 1),
			),
		).toMatch(/5MB/i);
		expect(
			validateSightingImage(fakeFile("nope.gif", "image/gif", 1000)),
		).toMatch(/jpg|png|webp|heic/i);
		expect(REPORTS_TO_HIDE).toBe(2);
	});
});
