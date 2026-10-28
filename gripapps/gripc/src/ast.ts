export type GripScalar = string | number | boolean;

export type MetaBlock = {
	title: string;
	blurb: string;
	theme: string;
};

export type ShellBlock = Record<string, GripScalar>;

export type StateBlock = Record<string, GripScalar>;

export type UiNode =
	| { kind: "stack"; children: UiNode[] }
	| { kind: "grid"; children: UiNode[] }
	| { kind: "hero"; children: UiNode[] }
	| { kind: "card"; children: UiNode[] }
	| { kind: "modal"; children: UiNode[] }
	| { kind: "canvas"; children: UiNode[] }
	| { kind: "tabs"; children: UiNode[] }
	| { kind: "text"; value: string }
	| { kind: "button"; id: string; label: string; action: string }
	| { kind: "toggle"; id: string; label?: string }
	| { kind: "slider"; id: string }
	| { kind: "toast"; message: string }
	| { kind: "sprite"; id: string }
	| { kind: "timer"; id: string }
	| { kind: "score_hud" }
	| { kind: "particles" }
	| { kind: "image"; src: string }
	| { kind: "emoji_stage"; emoji: string }
	| { kind: "clear"; color: string }
	| { kind: "raw_slot"; id: string };

export type SceneBlock = {
	id: string;
	vibe?: string;
	motion?: string;
	root: UiNode;
};

export type ActionStep =
	| { op: "set"; key: string; value: GripScalar }
	| { op: "goto"; scene: string }
	| { op: "back" }
	| { op: "toast"; message: string };

export type ActionBlock = {
	id: string;
	steps: ActionStep[];
};

export type RawModuleBlock = {
	path: string;
	exportName: string;
	slot: string;
};

export type GripApp = {
	meta: MetaBlock;
	shell?: ShellBlock;
	state: StateBlock;
	scenes: SceneBlock[];
	actions: ActionBlock[];
	rawModules: RawModuleBlock[];
};
