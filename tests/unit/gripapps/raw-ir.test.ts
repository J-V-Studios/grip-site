import { describe, expect, it } from "vitest";
import { compileGripSource } from "../../../gripapps/gripc/src/compile";

describe("raw module and canvas IR", () => {
	it("emits rawModules from raw_module declaration", () => {
		const result = compileGripSource(
			`
meta { title "T" blurb "B" theme lilgrip_default }
state { }
raw_module "./raw/hud.js" export mount_hud into slot hud
scene home { stack { text "hi" } }
`,
			"app.grip",
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.js).toContain('"rawModules"');
		expect(result.js).toContain("./raw/hud.js");
		expect(result.js).toContain("mount_hud");
		expect(result.js).toContain('"slot":"hud"');
	});

	it("emits canvas play nodes in scene IR", () => {
		const result = compileGripSource(
			`
meta { title "T" blurb "B" theme lilgrip_default }
state { score 0 }
scene game {
  canvas {
    clear "#112233"
    sprite player
    score_hud
    particles
  }
}
`,
			"app.grip",
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.js).toContain('"type":"canvas"');
		expect(result.js).toContain('"type":"clear"');
		expect(result.js).toContain('"type":"sprite"');
		expect(result.js).toContain('"id":"player"');
		expect(result.js).toContain('"type":"score_hud"');
		expect(result.js).toContain('"type":"particles"');
	});
});
