import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { vendorRuntime } from "../../../gripapps/gripc/src/vendor";

describe("vendorRuntime", () => {
	it("copies runtime and VERSION", async () => {
		const dir = await mkdtemp(path.join(tmpdir(), "grip-vendor-"));
		await vendorRuntime(process.cwd(), dir);
		const v = await readFile(path.join(dir, "vendor/gripapps/VERSION"), "utf8");
		expect(v.trim().length).toBeGreaterThan(0);
	});
});
