import type {
	ActionBlock,
	ActionStep,
	GripApp,
	RawModuleBlock,
	SceneBlock,
	UiNode,
} from "./ast";

export const GRIP_APP_API_VERSION = 1;

export type GripAppIr = {
	apiVersion: number;
	meta: GripApp["meta"];
	state: GripApp["state"];
	scenes: Array<{ id: string; root: IrUiNode }>;
	actions: Array<{ id: string; steps: ActionStep[] }>;
	rawModules: RawModuleBlock[];
};

type IrUiNode = Record<string, unknown>;

function uiNodeToIr(node: UiNode): IrUiNode {
	const { kind, ...rest } = node as UiNode & Record<string, unknown>;
	const ir: IrUiNode = { type: kind };

	for (const [key, value] of Object.entries(rest)) {
		if (key === "children" && Array.isArray(value)) {
			ir.children = value.map((child) => uiNodeToIr(child as UiNode));
		} else {
			ir[key] = value;
		}
	}

	return ir;
}

function sceneToIr(scene: SceneBlock) {
	return {
		id: scene.id,
		root: uiNodeToIr(scene.root),
	};
}

function actionToIr(action: ActionBlock) {
	return {
		id: action.id,
		steps: action.steps,
	};
}

export function buildGripAppIr(ast: GripApp): GripAppIr {
	return {
		apiVersion: GRIP_APP_API_VERSION,
		meta: ast.meta,
		state: ast.state,
		scenes: ast.scenes.map(sceneToIr),
		actions: ast.actions.map(actionToIr),
		rawModules: ast.rawModules,
	};
}

export function emitGripAppJs(ast: GripApp): string {
	const ir = buildGripAppIr(ast);
	return `globalThis.__GRIP_APP__ = ${JSON.stringify(ir)};\n`;
}
