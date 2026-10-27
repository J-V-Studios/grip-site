import { describe, expect, it } from "vitest";
import { parseGrip } from "../../../gripapps/gripc/src/parse";

const HELLO = `
meta {
  title "Hello Grip"
  blurb "tiny page"
  theme lilgrip_default
}

state {
  ready true
}

scene home {
  stack {
    text "hi"
    button start label "go" -> action wave
  }
}

action wave {
  set ready true
  goto home
}
`;

describe("parseGrip", () => {
	it("parses a minimal app", () => {
		const result = parseGrip(HELLO, "app.grip");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.ast.meta.title).toBe("Hello Grip");
		expect(result.ast.scenes[0]?.id).toBe("home");
		expect(result.ast.actions[0]?.id).toBe("wave");
	});

	it("errors on unknown top-level keyword with line hint", () => {
		const result = parseGrip(`widget {\n}\n`, "app.grip");
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.diagnostics[0]?.message).toMatch(/unknown/i);
		expect(result.diagnostics[0]?.line).toBe(1);
	});
});
