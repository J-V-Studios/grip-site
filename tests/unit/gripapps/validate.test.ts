import { describe, expect, it } from "vitest";
import { parseGrip } from "../../../gripapps/gripc/src/parse";
import { validateGrip } from "../../../gripapps/gripc/src/validate";

describe("validateGrip", () => {
	it("flags missing action target", () => {
		const parsed = parseGrip(
			`
meta { title "T" blurb "B" theme lilgrip_default }
state { }
scene home {
  stack {
    button x label "x" -> action nope
  }
}
`,
			"app.grip",
		);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		const diags = validateGrip(parsed.ast, "app.grip");
		expect(diags.some((d) => /action.*nope/i.test(d.message))).toBe(true);
	});

	it("flags a button with no action target", () => {
		const parsed = parseGrip(
			`
meta { title "T" blurb "B" theme lilgrip_default }
scene home {
  button x label "x"
}
`,
			"app.grip",
		);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		const diags = validateGrip(parsed.ast, "app.grip");
		expect(diags.some((d) => /missing an action target/i.test(d.message))).toBe(
			true,
		);
	});

	it("requires at least one scene", () => {
		const parsed = parseGrip(
			`
meta { title "T" blurb "B" theme lilgrip_default }
`,
			"app.grip",
		);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		const diags = validateGrip(parsed.ast, "app.grip");
		expect(diags.some((d) => /at least one scene/i.test(d.message))).toBe(true);
	});

	it("rejects raw_module paths with percent-encoded ..", () => {
		const parsed = parseGrip(
			`
meta { title "T" blurb "B" theme lilgrip_default }
raw_module "./raw/%2e%2e/%2e%2e/secret.js" export mount into slot stage
scene home { text "hi" }
`,
			"app.grip",
		);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		const diags = validateGrip(parsed.ast, "app.grip");
		expect(diags.some((d) => /percent-encoding/i.test(d.message))).toBe(true);
	});

	it("rejects raw_module paths that contain ..", () => {
		const parsed = parseGrip(
			`
meta { title "T" blurb "B" theme lilgrip_default }
raw_module "./raw/../secret.js" export mount into slot stage
scene home { text "hi" }
`,
			"app.grip",
		);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		const diags = validateGrip(parsed.ast, "app.grip");
		expect(diags.some((d) => d.message.includes(".."))).toBe(true);
	});

	it("rejects unimplemented interactive widgets", () => {
		const parsed = parseGrip(
			`
meta { title "T" blurb "B" theme lilgrip_default }
scene home {
  stack {
    toggle sound
    slider volume
    timer tick
    toast "nope"
  }
}
`,
			"app.grip",
		);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		const diags = validateGrip(parsed.ast, "app.grip");
		expect(diags.some((d) => d.message.includes("toggle"))).toBe(true);
		expect(diags.some((d) => d.message.includes("slider"))).toBe(true);
		expect(diags.some((d) => d.message.includes("timer"))).toBe(true);
		expect(diags.some((d) => /scene toast/i.test(d.message))).toBe(true);
	});

	it("accepts hello app", () => {
		const parsed = parseGrip(
			`
meta { title "T" blurb "B" theme lilgrip_default }
state { n 1 }
scene home { stack { text "hi" } }
action unused { goto home }
`,
			"app.grip",
		);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(validateGrip(parsed.ast, "app.grip")).toEqual([]);
	});
});
