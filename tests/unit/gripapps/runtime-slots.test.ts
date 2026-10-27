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
		expect(src).toContain("detachMountedRaw();");
		expect(src).toMatch(
			/sceneHost\.innerHTML = "";\s*\n\s*reconcileSlotRegistry\(\);/,
		);
		expect(src).toContain("getRegisteredSlot(slotName)");
		expect(src).toContain("mountedRaw");
		expect(src).toContain("reattachMountedRaw");
		expect(src).toContain("data-grip-shell-slot");
		expect(src).toContain("new URL(path, base)");
		expect(src).toContain("document.baseURI");
		expect(src).toContain('path.indexOf("..") === -1');
		expect(src).toContain("is not a function");
		expect(src).toContain("grip-grid");
		expect(src).toContain("grip-hero");
		expect(src).toContain("grip-card");
		expect(src).toContain("grip-modal");
		expect(src).toContain("grip-tabs");
	});
});
