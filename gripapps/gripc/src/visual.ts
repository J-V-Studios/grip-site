import type { GripApp, UiNode } from "./ast";

const VISUAL_KINDS = new Set<UiNode["kind"]>(["hero", "canvas", "emoji_stage"]);
const THIN_ALLOWED_KINDS = new Set<UiNode["kind"]>(["stack", "text", "button"]);

function walkUi(node: UiNode, state: { hasVisual: boolean; thinOnly: boolean }): void {
	if (VISUAL_KINDS.has(node.kind)) {
		state.hasVisual = true;
	}
	if (!THIN_ALLOWED_KINDS.has(node.kind)) {
		state.thinOnly = false;
	}
	if ("children" in node && node.children) {
		for (const child of node.children) {
			walkUi(child, state);
		}
	}
}

/** True when the app has no hero/canvas/emoji_stage and UI is only stack/text/button. */
export function isVisuallyThin(ast: GripApp): boolean {
	const state = { hasVisual: false, thinOnly: true };
	for (const scene of ast.scenes) {
		walkUi(scene.root, state);
	}
	return !state.hasVisual && state.thinOnly;
}

export const VISUAL_THIN_MESSAGE =
	"GripApp looks visually thin (text/button stack only). Add theme atmosphere: hero and/or canvas with emoji sprites, or emoji_stage.";

export function visualThinHint(enrichCommand: string): string {
	return `${VISUAL_THIN_MESSAGE}\nNext: ${enrichCommand} → expand app.grip → gripc check --visual → gripc build`;
}
