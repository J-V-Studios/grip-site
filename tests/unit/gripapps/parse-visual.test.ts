// tests/unit/gripapps/parse-visual.test.ts
import { describe, expect, it } from "vitest";
import { parseGrip } from "../../../gripapps/gripc/src/parse";

const SRC = `
meta {
  title "Vibe"
  blurb "neon"
  theme neon_lagoon
}

scene home {
  vibe neon_lagoon motion bounce
  stack {
    text "hi"
  }
}
`;

describe("parse vibe/motion", () => {
	it("parses scene vibe and motion", () => {
		const r = parseGrip(SRC, "app.grip");
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.ast.meta.theme).toBe("neon_lagoon");
		expect(r.ast.scenes[0]?.vibe).toBe("neon_lagoon");
		expect(r.ast.scenes[0]?.motion).toBe("bounce");
	});
});
