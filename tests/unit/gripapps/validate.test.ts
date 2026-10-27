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
