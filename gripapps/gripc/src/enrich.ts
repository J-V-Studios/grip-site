import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { compileGripSource } from "./compile";
import type { Diagnostic } from "./diagnostics";
import { parseGrip } from "./parse";
import { isVisuallyThin } from "./visual";

export const ENRICH_NOTES_FILENAME = "enrich-notes.md";

export function buildEnrichNotesMarkdown(
	gripFile: string,
	options: { visuallyThin: boolean },
): string {
	const thinNote = options.visuallyThin
		? "Current draft is **visually thin** — expand before ship."
		: "Draft parses; confirm atmosphere/play below before ship.";

	return `# Enrich checklist — ${gripFile}

${thinNote}

Agent expands \`app.grip\` in place (CLI does not call an LLM). Re-run \`gripc enrich\` after major edits to refresh this file.

## Required

- [ ] Named \`theme\` in \`meta\` (e.g. \`neon_lagoon\`, \`barn_night\`, \`candy_arcade\`, \`deep_space\`, \`lilgrip_default\`)
- [ ] Open with **hero** and/or **canvas** and/or **emoji_stage** (not text-wall only)
- [ ] Scene \`vibe <theme>\` and \`motion bounce|float|pulse|none\` where it fits
- [ ] Play/chase/score: \`canvas\` + emoji \`sprite\` + \`score_hud\` + \`particles\` + actions
- [ ] Tap toys: \`emoji_stage\` + toast/goto actions
- [ ] Enriched \`app.grip\` passes \`gripc check\` and \`gripc check --visual\`
- [ ] Honor \`prefers-reduced-motion\` (motion is decorative only)

## Escalation (only if Grip cannot carry the look)

- [ ] \`raw_module\` + pinned lib (e.g. three.js) under the community handle sandbox
- [ ] List escalations in this file under **Escalations**

## Escalations

_(none yet)_

## Workflow

1. Expand Grip in \`app.grip\` using the items above
2. \`gripc check <file>\`
3. \`gripc check --visual <file>\`
4. \`gripc build <file> --out <dir> --handle <handle>\`
`;
}

export type EnrichResult =
	| { ok: true; notesPath: string }
	| { ok: false; diagnostics: Diagnostic[] };

export async function enrichGripFile(gripFile: string): Promise<EnrichResult> {
	const source = await readFile(gripFile, "utf8");
	const compiled = compileGripSource(source, gripFile);
	if (!compiled.ok) {
		return { ok: false, diagnostics: compiled.diagnostics };
	}

	const parsed = parseGrip(source, gripFile);
	const visuallyThin = parsed.ok ? isVisuallyThin(parsed.ast) : false;
	const notesPath = join(dirname(gripFile), ENRICH_NOTES_FILENAME);
	const markdown = buildEnrichNotesMarkdown(gripFile, { visuallyThin });
	await writeFile(notesPath, markdown, "utf8");
	return { ok: true, notesPath };
}

export function printEnrichNextSteps(): void {
	console.log(
		"Next: expand app.grip (agent) → gripc check → gripc check --visual → gripc build --out … --handle …",
	);
}
