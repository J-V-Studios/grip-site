import type { GripApp, GripScalar, UiNode } from "./ast";
import { diagnostic, type Diagnostic } from "./diagnostics";
import { MOTION_PRESETS, THEME_PRESETS } from "./tokens";

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

	if (ast.scenes.length < 1) {
		diags.push(
			diagnostic(fileName, 1, 1, "App must include at least one scene"),
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

		if (scene.vibe !== undefined && !THEME_PRESETS.has(scene.vibe)) {
			diags.push(
				diagnostic(
					fileName,
					1,
					1,
					`Unknown vibe "${scene.vibe}"`,
					`Known presets: ${[...THEME_PRESETS].join(", ")}`,
				),
			);
		}
		if (scene.motion !== undefined && !MOTION_PRESETS.has(scene.motion)) {
			diags.push(
				diagnostic(
					fileName,
					1,
					1,
					`Unknown motion "${scene.motion}"`,
					`Known presets: ${[...MOTION_PRESETS].join(", ")}`,
				),
			);
		}
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
		validateRawModulePath(raw.path, fileName, diags);
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

function validateRawModulePath(
	path: string,
	fileName: string,
	diags: Diagnostic[],
): void {
	if (!path.startsWith("./raw/")) {
		diags.push(
			diagnostic(
				fileName,
				1,
				1,
				`raw_module path must start with "./raw/"`,
				`Got "${path}"`,
			),
		);
	}
	if (path.includes("..")) {
		diags.push(
			diagnostic(
				fileName,
				1,
				1,
				`raw_module path must not contain ".."`,
				`Got "${path}"`,
			),
		);
	}
	if (path.includes("%")) {
		diags.push(
			diagnostic(
				fileName,
				1,
				1,
				`raw_module path must not contain percent-encoding`,
				`Got "${path}"`,
			),
		);
		return;
	}
	let decoded: string;
	try {
		decoded = decodeURIComponent(path);
	} catch {
		diags.push(
			diagnostic(
				fileName,
				1,
				1,
				`raw_module path is not valid percent-encoding`,
				`Got "${path}"`,
			),
		);
		return;
	}
	if (decoded.includes("..")) {
		diags.push(
			diagnostic(
				fileName,
				1,
				1,
				`raw_module path must not contain ".." after decoding`,
				`Got "${path}"`,
			),
		);
	}
	if (
		decoded.startsWith("/") ||
		decoded.startsWith("//") ||
		/^[a-zA-Z]:[\\/]/.test(decoded)
	) {
		diags.push(
			diagnostic(
				fileName,
				1,
				1,
				`raw_module path must stay relative under "./raw/"`,
				`Got "${path}"`,
			),
		);
	}
}

function validateUiReferences(
	node: UiNode,
	fileName: string,
	knownActions: Set<string>,
	diags: Diagnostic[],
): void {
	if (
		node.kind === "toggle" ||
		node.kind === "slider" ||
		node.kind === "timer" ||
		node.kind === "toast"
	) {
		diags.push(
			diagnostic(
				fileName,
				1,
				1,
				node.kind === "toast"
					? 'Scene toast is not implemented; use an action step toast "..."'
					: `"${node.kind}" is not implemented in the runtime`,
				"Remove this widget until the runtime supports it",
			),
		);
	}

	if (node.kind === "button") {
		if (!node.action.trim()) {
			diags.push(
				diagnostic(
					fileName,
					1,
					1,
					`Button "${node.id}" is missing an action target`,
					'Use: button <id> label "..." -> action <actionId>',
				),
			);
		} else if (!knownActions.has(node.action)) {
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
