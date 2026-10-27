import { describe, expect, it } from "vitest";
import { compileGripSource } from "../../../gripapps/gripc/src/compile";

describe("compileGripSource", () => {
	it("emits apiVersion and meta", () => {
		const result = compileGripSource(
			`
meta { title "T" blurb "B" theme lilgrip_default }
state { }
scene home { stack { text "hi" } }
`,
			"app.grip",
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.js).toContain("apiVersion");
		expect(result.js).toContain("__GRIP_APP__");
		expect(result.manifest.title).toBe("T");
		expect(result.apiVersion).toBe(1);
	});

	it("emits action step opcodes in IR", () => {
		const result = compileGripSource(
			`
meta { title "T" blurb "B" theme lilgrip_default }
state { ready false }
scene home { stack { text "hi" } }
action wave { set ready true goto home }
`,
			"app.grip",
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.js).toContain('"op":"set"');
		expect(result.js).toContain('"op":"goto"');
	});
});
