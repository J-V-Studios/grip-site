import type { GripApp, GripScalar, UiNode } from "./ast";
import { diagnostic, type Diagnostic } from "./diagnostics";
import { THEME_PRESETS } from "./tokens";

export function validateGrip(ast: GripApp, fileName: string): Diagnostic[] {
	const diags: Diagnostic[] = [];

	if (!ast.meta.title.trim()) {
		diags.push(
			diagnostic(fileName, 1, 1, "meta.title must be non-empty"),
		);
	}
	if (!ast.meta.blurb.trim()) {
		diags.push(
			diagnostic(fileName, 1, 1, "meta.blurb must be non-empty"),
		);
	}
	if (!THEME_PRESETS.has(ast.meta.theme)) {
		diags.push(
			diagnostic(
				fileName,
				1,
				1,
				`Unknown theme "${ast.meta.theme}"`,
				`Known presets: ${[...THEME_PRESETS].join(", ")}`,
			),
		);
	}

	const sceneIds = new Set<string>();
	for (const scene of ast.scenes) {
		if (sceneIds.has(scene.id)) {
			diags.push(
				diagnostic(fileName, 1, 1, `Duplicate scene id "${scene.id}"`),
			);
		}
		sceneIds.add(scene.id);
	}

	const actionIds = new Set<string>();
	for (const action of ast.actions) {
		if (actionIds.has(action.id)) {
			diags.push(
				diagnostic(fileName, 1, 1, `Duplicate action id "${action.id}"`),
			);
		}
		actionIds.add(action.id);
	}

	const knownActions = actionIds;

	for (const scene of ast.scenes) {
		validateUiReferences(scene.root, fileName, knownActions, diags);
	}

	for (const action of ast.actions) {
		for (const step of action.steps) {
			if (step.op === "goto" && !sceneIds.has(step.scene)) {
				diags.push(
					diagnostic(
						fileName,
						1,
						1,
						`Unknown scene "${step.scene}" in goto`,
					),
				);
			}
		}
	}

	for (const raw of ast.rawModules) {
		if (!raw.path.startsWith("./raw/")) {
			diags.push(
				diagnostic(
					fileName,
					1,
					1,
					`raw_module path must start with "./raw/"`,
					`Got "${raw.path}"`,
				),
			);
		}
		if (!raw.exportName.trim()) {
			diags.push(
				diagnostic(fileName, 1, 1, "raw_module requires export name"),
			);
		}
		if (!raw.slot.trim()) {
			diags.push(
				diagnostic(fileName, 1, 1, "raw_module requires into slot name"),
			);
		}
	}

	for (const [key, value] of Object.entries(ast.state)) {
		if (!isValidStateValue(value)) {
			diags.push(
				diagnostic(
					fileName,
					1,
					1,
					`Invalid state value for "${key}"`,
				),
			);
		}
	}

	return diags;
}

function validateUiReferences(
	node: UiNode,
	fileName: string,
	knownActions: Set<string>,
	diags: Diagnostic[],
): void {
	if (node.kind === "button" && node.action) {
		if (!knownActions.has(node.action)) {
			diags.push(
				diagnostic(
					fileName,
					1,
					1,
					`Unknown action "${node.action}"`,
				),
			);
		}
	}

	if ("children" in node) {
		for (const child of node.children) {
			validateUiReferences(child, fileName, knownActions, diags);
		}
	}
}

function isValidStateValue(value: GripScalar | unknown): boolean {
	if (value === null) return true;
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return true;
	}
	if (Array.isArray(value)) {
		return value.every(isValidStateValue);
	}
	if (typeof value === "object" && value !== null) {
		return Object.values(value as Record<string, unknown>).every(
			isValidStateValue,
		);
	}
	return false;
}
