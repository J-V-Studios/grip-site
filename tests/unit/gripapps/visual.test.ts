import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseGrip } from "../../../gripapps/gripc/src/parse";
import { isVisuallyThin } from "../../../gripapps/gripc/src/visual";

const HELLO_GRIP = readFileSync(
	join(process.cwd(), "gripapps/templates/hello.grip"),
	"utf8",
);

const VISUAL_PLAY_SRC = `
meta { title "Laser Lagoon" blurb "toy" theme neon_lagoon }
scene home {
  vibe neon_lagoon motion bounce
  stack {
    hero {
      title "Laser Lagoon"
      blurb "toy lasers only"
      emoji "🦈"
    }
    canvas {
      clear "#0b1020"
      sprite shark emoji "🦈"
      score_hud
      particles
    }
  }
}
`;

describe("isVisuallyThin", () => {
	it("flags text+button only apps", () => {
		const r = parseGrip(HELLO_GRIP, "hello.grip");
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(isVisuallyThin(r.ast)).toBe(true);
	});

	it("passes visual_play shape", () => {
		const r = parseGrip(VISUAL_PLAY_SRC, "visual_play.grip");
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(isVisuallyThin(r.ast)).toBe(false);
	});

	it("passes meme_stage emoji_stage", () => {
		const src = readFileSync(
			join(process.cwd(), "gripapps/templates/meme_stage.grip"),
			"utf8",
		);
		const r = parseGrip(src, "meme_stage.grip");
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(isVisuallyThin(r.ast)).toBe(false);
	});
});
