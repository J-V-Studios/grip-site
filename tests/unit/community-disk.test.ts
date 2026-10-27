import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fetchGalleryFromDisk } from "@/lib/community-disk";

describe("fetchGalleryFromDisk", () => {
	it("skips underscore handles and the reserved demo", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "grip-gallery-"));
		for (const handle of ["cool-page", "gripapps-demo", "_gripapps_fixture"]) {
			const dir = path.join(root, handle);
			await mkdir(dir);
			await writeFile(
				path.join(dir, "manifest.json"),
				JSON.stringify({
					handle,
					title: handle,
					blurb: "x",
					builtAt: "2026-10-27T00:00:00.000Z",
				}),
			);
		}

		const items = await fetchGalleryFromDisk(root);
		expect(items.map((item) => item.handle)).toEqual(["cool-page"]);
	});
});
