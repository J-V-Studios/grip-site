import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
	getSupabase: vi.fn(),
}));

import { fetchLiveCommunityPages, mergeGalleryLists } from "@/lib/community";
import { getSupabase } from "@/lib/supabase";

function mockGalleryQuery(result: { data: unknown; error: Error | null }) {
	const order = vi.fn().mockResolvedValue(result);
	const select = vi.fn().mockReturnValue({ order });
	const from = vi.fn().mockReturnValue({ select });
	vi.mocked(getSupabase).mockReturnValue({ from } as unknown as ReturnType<
		typeof getSupabase
	>);
	return { from, select, order };
}

describe("fetchLiveCommunityPages", () => {
	beforeEach(() => {
		vi.mocked(getSupabase).mockReset();
	});

	it("queries community_gallery and maps rows to camelCase", async () => {
		const { from, select, order } = mockGalleryQuery({
			data: [
				{
					handle: "cool-page",
					title: "Cool",
					blurb: "A build",
					updated_at: "2026-10-26T12:00:00.000Z",
				},
			],
			error: null,
		});

		const items = await fetchLiveCommunityPages();

		expect(from).toHaveBeenCalledWith("community_gallery");
		expect(select).toHaveBeenCalledWith("handle,title,blurb,updated_at");
		expect(order).toHaveBeenCalledWith("updated_at", { ascending: false });
		expect(items).toEqual([
			{
				handle: "cool-page",
				title: "Cool",
				blurb: "A build",
				updatedAt: "2026-10-26T12:00:00.000Z",
			},
		]);
	});

	it("returns an empty list when there is no data", async () => {
		mockGalleryQuery({ data: null, error: null });
		await expect(fetchLiveCommunityPages()).resolves.toEqual([]);
	});

	it("propagates supabase errors", async () => {
		mockGalleryQuery({
			data: null,
			error: new Error("permission denied"),
		});
		await expect(fetchLiveCommunityPages()).rejects.toThrow(
			"permission denied",
		);
	});
});

describe("mergeGalleryLists", () => {
	it("prefers primary rows and fills gaps from fallback", () => {
		const merged = mergeGalleryLists(
			[
				{
					handle: "a",
					title: "From DB",
					blurb: "db",
					updatedAt: "2026-10-27T12:00:00.000Z",
				},
			],
			[
				{
					handle: "a",
					title: "From disk",
					blurb: "disk",
					updatedAt: "2026-10-26T12:00:00.000Z",
				},
				{
					handle: "b",
					title: "Disk only",
					blurb: null,
					updatedAt: "2026-10-27T11:00:00.000Z",
				},
			],
		);
		expect(merged).toEqual([
			{
				handle: "a",
				title: "From DB",
				blurb: "db",
				updatedAt: "2026-10-27T12:00:00.000Z",
			},
			{
				handle: "b",
				title: "Disk only",
				blurb: null,
				updatedAt: "2026-10-27T11:00:00.000Z",
			},
		]);
	});
});
