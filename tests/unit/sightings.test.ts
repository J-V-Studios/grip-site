import { describe, expect, it } from "vitest";
import { aggregatePoints, extFor, rankedLeaders } from "@/lib/sightings";

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
});
