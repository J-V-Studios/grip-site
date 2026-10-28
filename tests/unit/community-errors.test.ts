import { describe, expect, it } from "vitest";
import { humanizeCommunityBuildError } from "../../src/lib/community-errors";

describe("humanizeCommunityBuildError", () => {
	it("maps Cursor prepaid exhaustion", () => {
		const raw =
			'Cursor API 400: {"error":{"code":"usage_limit_exceeded","message":"Your prepaid balance is used up. Add funds or enable auto top-up in your billing settings to keep going."}}';
		expect(humanizeCommunityBuildError(raw)).toMatch(/billing is empty/i);
	});

	it("maps invalid API key", () => {
		expect(
			humanizeCommunityBuildError(
				'Cursor API 401: {"code":"error","message":"Invalid User API Key"}',
			),
		).toMatch(/API key rejected/i);
	});

	it("passes through unknown errors", () => {
		expect(humanizeCommunityBuildError("boom")).toBe("boom");
	});
});
