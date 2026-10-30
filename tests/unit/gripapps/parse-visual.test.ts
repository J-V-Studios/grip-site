// tests/unit/gripapps/parse-visual.test.ts
import { describe, expect, it } from "vitest";
import { emitGripAppJs } from "../../../gripapps/gripc/src/codegen";
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

const HERO_SPRITE_SRC = `
meta { title "T" blurb "b" theme lilgrip_default }
scene home {
  vibe lilgrip_default motion none
  stack {
    hero {
      title "Lagoon"
      blurb "toy lasers"
      emoji "🦈"
      text "go"
    }
    canvas {
      clear "#000"
      sprite cow emoji "🐄"
    }
  }
}
`;

describe("parse hero fields and sprite emoji", () => {
	it("parses hero fields and sprite emoji", () => {
		const r = parseGrip(HERO_SPRITE_SRC, "app.grip");
		expect(r.ok).toBe(true);
		if (!r.ok) return;

		const stack = r.ast.scenes[0]?.root;
		expect(stack?.kind).toBe("stack");
		if (stack?.kind !== "stack") return;

		const hero = stack.children[0];
		expect(hero?.kind).toBe("hero");
		if (hero?.kind !== "hero") return;
		expect(hero.title).toBe("Lagoon");
		expect(hero.blurb).toBe("toy lasers");
		expect(hero.emoji).toBe("🦈");
		expect(hero.children).toHaveLength(1);
		expect(hero.children[0]?.kind).toBe("text");

		const canvas = stack.children[1];
		expect(canvas?.kind).toBe("canvas");
		if (canvas?.kind !== "canvas") return;
		const sprite = canvas.children.find((n) => n.kind === "sprite");
		expect(sprite?.kind).toBe("sprite");
		if (sprite?.kind !== "sprite") return;
		expect(sprite.id).toBe("cow");
		expect(sprite.emoji).toBe("🐄");

		const js = emitGripAppJs(r.ast);
		expect(js).toContain('"title":"Lagoon"');
		expect(js).toContain('"emoji":"🦈"');
		expect(js).toContain('"emoji":"🐄"');
	});

	it("keeps hero-with-children-only backward compatible", () => {
		const src = `
meta { title "T" blurb "B" theme lilgrip_default }
scene home { stack { hero { text "only child" } } }
`;
		const r = parseGrip(src, "app.grip");
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		const hero = r.ast.scenes[0]?.root;
		if (hero?.kind === "stack") {
			const h = hero.children[0];
			expect(h?.kind).toBe("hero");
			if (h?.kind === "hero") {
				expect(h.title).toBeUndefined();
				expect(h.children[0]?.kind).toBe("text");
			}
		}
	});
});
