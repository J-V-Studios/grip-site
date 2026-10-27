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
	it("parses a minimal app into a full IR", () => {
		const result = parseGrip(HELLO, "app.grip");
		expect(result).toEqual({
			ok: true,
			ast: {
				meta: {
					title: "Hello Grip",
					blurb: "tiny page",
					theme: "lilgrip_default",
				},
				shell: undefined,
				state: { ready: true },
				scenes: [
					{
						id: "home",
						root: {
							kind: "stack",
							children: [
								{ kind: "text", value: "hi" },
								{
									kind: "button",
									id: "start",
									label: "go",
									action: "wave",
								},
							],
						},
					},
				],
				actions: [
					{
						id: "wave",
						steps: [
							{ op: "set", key: "ready", value: true },
							{ op: "goto", scene: "home" },
						],
					},
				],
				rawModules: [],
			},
		});
	});

	it("errors on unknown top-level keyword with line hint", () => {
		const result = parseGrip(`widget {\n}\n`, "app.grip");
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.diagnostics[0]?.message).toMatch(/unknown/i);
		expect(result.diagnostics[0]?.line).toBe(1);
	});

	it("fails parse on unknown scene child keyword", () => {
		const source = `
meta {
  title "t"
  blurb "b"
  theme lilgrip_default
}

scene home {
  widget foo
}
`;
		const result = parseGrip(source, "app.grip");
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.diagnostics[0]?.message).toMatch(/unknown scene child/i);
		expect(result.diagnostics[0]?.message).toContain("widget");
	});

	it("fails parse on unknown action step keyword", () => {
		const source = `
meta {
  title "t"
  blurb "b"
  theme lilgrip_default
}

action wave {
  jump somewhere
}
`;
		const result = parseGrip(source, "app.grip");
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(
			result.diagnostics.some((d) => /unknown action step/i.test(d.message)),
		).toBe(true);
		expect(result.diagnostics.some((d) => d.message.includes("jump"))).toBe(
			true,
		);
	});

	it("diagnoses unexpected top-level tokens instead of dropping the rest", () => {
		const source = `
meta { title "T" blurb "B" theme lilgrip_default }
scene home { text "hi" }
@@@
scene other { text "bye" }
`;
		const result = parseGrip(source, "app.grip");
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(
			result.diagnostics.some((d) => /unexpected token/i.test(d.message)),
		).toBe(true);
	});

	it("diagnoses unexpected scene tokens instead of dropping siblings", () => {
		const source = `
meta { title "T" blurb "B" theme lilgrip_default }
scene home {
  text "hi"
  !!!
  text "still here"
}
`;
		const result = parseGrip(source, "app.grip");
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(
			result.diagnostics.some((d) => /unexpected token "!"/i.test(d.message)),
		).toBe(true);
	});

	it("does not swallow the following scene on a raw_module line", () => {
		const source = `
meta { title "T" blurb "B" theme lilgrip_default }
raw_module "./raw/a.js" export mount into slot stage
scene home { text "after" }
`;
		const result = parseGrip(source, "app.grip");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.ast.rawModules).toEqual([
			{ path: "./raw/a.js", exportName: "mount", slot: "stage" },
		]);
		expect(result.ast.scenes).toEqual([
			{
				id: "home",
				root: { kind: "text", value: "after" },
			},
		]);
	});

	it("ignores braces inside strings when reading blocks", () => {
		const source = `
meta { title "T" blurb "B" theme lilgrip_default }
scene home {
  stack {
    text "a { b } c"
  }
  text "after"
}
`;
		const result = parseGrip(source, "app.grip");
		expect(result).toEqual({
			ok: true,
			ast: {
				meta: { title: "T", blurb: "B", theme: "lilgrip_default" },
				shell: undefined,
				state: {},
				scenes: [
					{
						id: "home",
						root: {
							kind: "stack",
							children: [
								{
									kind: "stack",
									children: [{ kind: "text", value: "a { b } c" }],
								},
								{ kind: "text", value: "after" },
							],
						},
					},
				],
				actions: [],
				rawModules: [],
			},
		});
	});

	it("keeps the last character before a closing brace", () => {
		const result = parseGrip(
			`meta { title "T" blurb "B" theme lilgrip_default }\nscene home { text hi}`,
			"app.grip",
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.ast.scenes[0]?.root).toEqual({
			kind: "text",
			value: "hi",
		});
	});

	it("reports nested diagnostics with file-absolute lines", () => {
		const source = [
			'meta { title "T" blurb "B" theme lilgrip_default }',
			"scene home {",
			"  stack {",
			"    bogus_widget",
			"  }",
			"}",
			"",
		].join("\n");
		const line =
			source.split("\n").findIndex((row) => row.includes("bogus_widget")) + 1;
		const result = parseGrip(source, "app.grip");
		expect(result.ok).toBe(false);
		if (result.ok) return;
		const diag = result.diagnostics.find((d) => /bogus_widget/.test(d.message));
		expect(diag?.line).toBe(line);
		expect(line).toBeGreaterThan(1);
	});

	it("diagnoses a duplicate meta block", () => {
		const result = parseGrip(
			`
meta { title "A" blurb "B" theme lilgrip_default }
meta { title "C" blurb "D" theme lilgrip_default }
scene home { text "hi" }
`,
			"app.grip",
		);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(
			result.diagnostics.some((d) => /duplicate meta/i.test(d.message)),
		).toBe(true);
	});
});
