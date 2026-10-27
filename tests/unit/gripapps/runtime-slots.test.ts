import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contract: in-scene raw_slot nodes must not linger in slotRegistry after
 * renderScene clears sceneHost — host.ui.mount breaks on goto/back otherwise.
 */
describe("gripapps runtime slot registry", () => {
	it("reconciles detached slots on scene render and uses isConnected", async () => {
		const src = await readFile(
			path.join(process.cwd(), "public/gripapps/runtime.js"),
			"utf8",
		);
		expect(src).toContain("function reconcileSlotRegistry()");
		expect(src).toContain("function getRegisteredSlot(name)");
		expect(src).toContain("el.isConnected");
		expect(src).toMatch(
			/sceneHost\.innerHTML = "";\s*\n\s*reconcileSlotRegistry\(\);/,
		);
		expect(src).toContain("getRegisteredSlot(slotName)");
	});
});
