import type {
	ActionBlock,
	ActionStep,
	GripApp,
	GripScalar,
	MetaBlock,
	RawModuleBlock,
	SceneBlock,
	ShellBlock,
	StateBlock,
	UiNode,
} from "./ast";
import { diagnostic, type Diagnostic } from "./diagnostics";
import {
	LAYOUT_BLOCK_KEYWORDS,
	SCENE_CHILD_KEYWORDS,
	TOP_LEVEL_KEYWORDS,
} from "./tokens";

export type ParseResult =
	| { ok: true; ast: GripApp }
	| { ok: false; diagnostics: Diagnostic[] };

type Span = { line: number; column: number };

export function parseGrip(
	source: string,
	fileName = "<stdin>",
): ParseResult {
	const diagnostics: Diagnostic[] = [];
	const ctx = createContext(source, fileName, diagnostics);

	const meta: MetaBlock = { title: "", blurb: "", theme: "" };
	let shell: ShellBlock | undefined;
	const state: StateBlock = {};
	const scenes: SceneBlock[] = [];
	const actions: ActionBlock[] = [];
	const rawModules: RawModuleBlock[] = [];
	let sawMeta = false;

	while (!ctx.eof()) {
		ctx.skipWhitespaceAndComments();
		if (ctx.eof()) break;

		const kw = ctx.readWord();
		if (!kw) {
			reportUnexpected(ctx);
			continue;
		}

		if (!TOP_LEVEL_KEYWORDS.has(kw)) {
			const at = ctx.spanAt(ctx.pos - kw.length);
			diagnostics.push(
				diagnostic(
					fileName,
					at.line,
					at.column,
					`Unknown top-level keyword "${kw}"`,
					`Expected one of: ${[...TOP_LEVEL_KEYWORDS].join(", ")}`,
				),
			);
			return { ok: false, diagnostics };
		}

		if (kw === "meta") {
			if (sawMeta) {
				const at = ctx.spanAt(ctx.pos - kw.length);
				diagnostics.push(
					diagnostic(fileName, at.line, at.column, "Duplicate meta block"),
				);
			}
			parseMetaBlock(ctx, meta);
			sawMeta = true;
		} else if (kw === "shell") {
			shell = parsePropertyBlock(ctx);
		} else if (kw === "state") {
			Object.assign(state, parsePropertyBlock(ctx));
		} else if (kw === "scene") {
			scenes.push(parseSceneBlock(ctx));
		} else if (kw === "action") {
			actions.push(parseActionBlock(ctx));
		} else if (kw === "raw_module") {
			rawModules.push(parseRawModuleLine(ctx));
		}
	}

	if (!sawMeta) {
		diagnostics.push(
			diagnostic(fileName, 1, 1, "Missing required meta block"),
		);
		return { ok: false, diagnostics };
	}

	if (diagnostics.length > 0) {
		return { ok: false, diagnostics };
	}

	return {
		ok: true,
		ast: { meta, shell, state, scenes, actions, rawModules },
	};
}

type ParseContext = {
	source: string;
	fileName: string;
	diagnostics: Diagnostic[];
	pos: number;
	lineStarts: number[];
	readWord: () => string;
	peekWord: () => string;
	skipWhitespaceAndComments: () => void;
	expect: (ch: string) => boolean;
	eof: () => boolean;
	spanAt: (index: number) => Span;
};

function createContext(
	source: string,
	fileName: string,
	diagnostics: Diagnostic[],
	origin?: Span,
): ParseContext {
	const lineStarts = [0];
	for (let i = 0; i < source.length; i++) {
		if (source[i] === "\n") lineStarts.push(i + 1);
	}

	const ctx: ParseContext = {
		source,
		fileName,
		diagnostics,
		pos: 0,
		lineStarts,
		readWord: () => "",
		peekWord: () => "",
		skipWhitespaceAndComments: () => {},
		expect: () => false,
		eof: () => false,
		spanAt: () => ({ line: 1, column: 1 }),
	};

	ctx.spanAt = (index: number): Span => {
		let line = 1;
		for (let i = 1; i < lineStarts.length; i++) {
			if (lineStarts[i] > index) break;
			line = i + 1;
		}
		const lineStart = lineStarts[line - 1] ?? 0;
		const column = index - lineStart + 1;
		if (!origin) return { line, column };
		if (line <= 1) {
			return {
				line: origin.line,
				column: origin.column + column - 1,
			};
		}
		return { line: origin.line + line - 1, column };
	};

	ctx.eof = () => ctx.pos >= source.length;

	ctx.skipWhitespaceAndComments = () => {
		while (ctx.pos < source.length) {
			const ch = source[ctx.pos];
			if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
				ctx.pos++;
				continue;
			}
			if (ch === "/" && source[ctx.pos + 1] === "/") {
				ctx.pos += 2;
				while (ctx.pos < source.length && source[ctx.pos] !== "\n") {
					ctx.pos++;
				}
				continue;
			}
			break;
		}
	};

	ctx.readWord = (): string => {
		ctx.skipWhitespaceAndComments();
		const start = ctx.pos;
		if (ctx.pos >= source.length) return "";
		const first = source[ctx.pos];
		if (!isIdentStart(first)) return "";
		ctx.pos++;
		while (ctx.pos < source.length && isIdentPart(source[ctx.pos])) {
			ctx.pos++;
		}
		return source.slice(start, ctx.pos);
	};

	ctx.peekWord = (): string => {
		const saved = ctx.pos;
		const word = ctx.readWord();
		ctx.pos = saved;
		return word;
	};

	ctx.expect = (ch: string): boolean => {
		ctx.skipWhitespaceAndComments();
		if (source[ctx.pos] === ch) {
			ctx.pos++;
			return true;
		}
		return false;
	};

	return ctx;
}

function nestedContext(
	parent: ParseContext,
	body: string,
	bodyStart: number,
): ParseContext {
	return createContext(
		body,
		parent.fileName,
		parent.diagnostics,
		parent.spanAt(bodyStart),
	);
}

function isIdentStart(ch: string): boolean {
	return /[A-Za-z_]/.test(ch);
}

function isIdentPart(ch: string): boolean {
	return /[A-Za-z0-9_]/.test(ch);
}

function reportUnexpected(ctx: ParseContext): void {
	if (ctx.eof()) return;
	const at = ctx.spanAt(ctx.pos);
	const ch = sourceChar(ctx) || "?";
	ctx.diagnostics.push(
		diagnostic(
			ctx.fileName,
			at.line,
			at.column,
			`Unexpected token "${ch}"`,
		),
	);
	ctx.pos += 1;
}

function readString(ctx: ParseContext): string {
	ctx.skipWhitespaceAndComments();
	if (sourceChar(ctx) !== '"') {
		return "";
	}
	ctx.pos++;
	let value = "";
	while (ctx.pos < ctx.source.length) {
		const ch = ctx.source[ctx.pos];
		if (ch === '"') {
			ctx.pos++;
			return value;
		}
		if (ch === "\\") {
			ctx.pos++;
			if (ctx.pos < ctx.source.length) {
				value += ctx.source[ctx.pos];
				ctx.pos++;
			}
			continue;
		}
		value += ch;
		ctx.pos++;
	}
	return value;
}

function sourceChar(ctx: ParseContext): string {
	return ctx.source[ctx.pos] ?? "";
}

function readArrow(ctx: ParseContext): boolean {
	ctx.skipWhitespaceAndComments();
	if (ctx.source[ctx.pos] === "-" && ctx.source[ctx.pos + 1] === ">") {
		ctx.pos += 2;
		return true;
	}
	return false;
}

function readScalar(ctx: ParseContext): GripScalar {
	ctx.skipWhitespaceAndComments();
	if (sourceChar(ctx) === '"') {
		return readString(ctx);
	}
	const numStart = ctx.pos;
	if (sourceChar(ctx) === "-" || /[0-9]/.test(sourceChar(ctx))) {
		if (sourceChar(ctx) === "-") ctx.pos++;
		while (ctx.pos < ctx.source.length && /[0-9.]/.test(ctx.source[ctx.pos])) {
			ctx.pos++;
		}
		const num = ctx.source.slice(numStart, ctx.pos);
		if (/^-?\d+(\.\d+)?$/.test(num)) return Number(num);
		ctx.pos = numStart;
	}
	const word = ctx.readWord();
	if (word === "true") return true;
	if (word === "false") return false;
	if (/^-?\d+(\.\d+)?$/.test(word)) return Number(word);
	return word;
}

function readBlockBody(ctx: ParseContext): { body: string; start: number } {
	ctx.skipWhitespaceAndComments();
	if (!ctx.expect("{")) return { body: "", start: ctx.pos };
	const start = ctx.pos;
	let depth = 1;
	let inString = false;
	while (ctx.pos < ctx.source.length && depth > 0) {
		const ch = ctx.source[ctx.pos];
		if (inString) {
			if (ch === "\\") {
				ctx.pos += 1;
				if (ctx.pos < ctx.source.length) ctx.pos += 1;
				continue;
			}
			if (ch === '"') inString = false;
			ctx.pos += 1;
			continue;
		}
		if (ch === '"') {
			inString = true;
			ctx.pos += 1;
			continue;
		}
		if (ch === "/" && ctx.source[ctx.pos + 1] === "/") {
			while (ctx.pos < ctx.source.length && ctx.source[ctx.pos] !== "\n") {
				ctx.pos += 1;
			}
			continue;
		}
		if (ch === "{") depth += 1;
		else if (ch === "}") depth -= 1;
		if (depth === 0) break;
		ctx.pos += 1;
	}
	const end = ctx.pos;
	if (ctx.pos < ctx.source.length && ctx.source[ctx.pos] === "}") {
		ctx.pos += 1;
	}
	return { body: ctx.source.slice(start, end), start };
}

function parseMetaBlock(ctx: ParseContext, meta: MetaBlock): void {
	const block = readBlockBody(ctx);
	const inner = nestedContext(ctx, block.body, block.start);
	const props = parsePropertyLines(inner);
	meta.title = String(props.title ?? "");
	meta.blurb = String(props.blurb ?? "");
	meta.theme = String(props.theme ?? "");
}

function parsePropertyLines(ctx: ParseContext): Record<string, GripScalar> {
	const props: Record<string, GripScalar> = {};
	while (!ctx.eof()) {
		ctx.skipWhitespaceAndComments();
		if (ctx.eof()) break;
		const key = ctx.readWord();
		if (!key || key === "}") break;
		props[key] = readScalar(ctx);
	}
	return props;
}

function parsePropertyBlock(ctx: ParseContext): Record<string, GripScalar> {
	ctx.skipWhitespaceAndComments();
	if (!ctx.expect("{")) return {};
	const props: Record<string, GripScalar> = {};
	while (!ctx.eof()) {
		ctx.skipWhitespaceAndComments();
		if (ctx.eof()) break;
		if (sourceChar(ctx) === "}") {
			ctx.pos++;
			break;
		}
		const key = ctx.readWord();
		if (!key) break;
		props[key] = readScalar(ctx);
	}
	return props;
}

function parseSceneBlock(ctx: ParseContext): SceneBlock {
	const id = ctx.readWord();
	ctx.skipWhitespaceAndComments();
	const block = readBlockBody(ctx);
	const inner = nestedContext(ctx, block.body, block.start);

	let vibe: string | undefined;
	let motion: string | undefined;
	while (!inner.eof()) {
		inner.skipWhitespaceAndComments();
		if (inner.eof()) break;
		const kw = inner.peekWord();
		if (kw === "}") break;
		if (kw === "vibe") {
			inner.readWord();
			vibe = inner.readWord();
			continue;
		}
		if (kw === "motion") {
			inner.readWord();
			motion = inner.readWord();
			continue;
		}
		break;
	}

	const root = parseUiNodes(inner);
	if (!root) {
		return { id, vibe, motion, root: { kind: "stack", children: [] } };
	}
	return { id, vibe, motion, root };
}

function parseUiNodes(ctx: ParseContext): UiNode | null {
	ctx.skipWhitespaceAndComments();
	if (ctx.eof()) return null;
	const nodes = parseUiNodeList(ctx);
	if (nodes.length === 1) return nodes[0];
	if (nodes.length > 1) {
		return { kind: "stack", children: nodes };
	}
	return null;
}

function parseUiNodeList(ctx: ParseContext): UiNode[] {
	const nodes: UiNode[] = [];
	while (!ctx.eof()) {
		ctx.skipWhitespaceAndComments();
		if (ctx.eof()) break;
		const kw = ctx.peekWord();
		if (kw === "}") break;
		if (!kw) {
			reportUnexpected(ctx);
			continue;
		}
		nodes.push(parseUiNode(ctx));
	}
	return nodes;
}

function parseUiNode(ctx: ParseContext): UiNode {
	const kw = ctx.readWord();
	if (!SCENE_CHILD_KEYWORDS.has(kw)) {
		const at = ctx.spanAt(Math.max(0, ctx.pos - kw.length));
		ctx.diagnostics.push(
			diagnostic(
				ctx.fileName,
				at.line,
				at.column,
				`Unknown scene child "${kw}"`,
			),
		);
		return { kind: "text", value: "" };
	}

	if (LAYOUT_BLOCK_KEYWORDS.has(kw)) {
		if (kw === "hero") {
			return parseHeroBlock(ctx);
		}
		const block = readBlockBody(ctx);
		const inner = nestedContext(ctx, block.body, block.start);
		const children = parseUiNodeList(inner);
		return { kind: kw as LayoutKind, children };
	}

	if (kw === "text") {
		const value = String(readScalar(ctx));
		return { kind: "text", value };
	}

	if (kw === "button") {
		const id = ctx.readWord();
		ctx.skipWhitespaceAndComments();
		let label = "";
		if (ctx.peekWord() === "label") {
			ctx.readWord();
			label = String(readScalar(ctx));
		}
		ctx.skipWhitespaceAndComments();
		if (readArrow(ctx)) {
			const actionKw = ctx.readWord();
			const actionId = ctx.readWord();
			if (actionKw !== "action") {
				ctx.diagnostics.push(
					diagnostic(
						ctx.fileName,
						ctx.spanAt(ctx.pos).line,
						ctx.spanAt(ctx.pos).column,
						'Expected "action" after "->"',
					),
				);
			}
			return { kind: "button", id, label, action: actionId };
		}
		return { kind: "button", id, label, action: "" };
	}

	if (kw === "toast") {
		const message = String(readScalar(ctx));
		return { kind: "toast", message };
	}

	if (kw === "image") {
		const src = String(readScalar(ctx));
		return { kind: "image", src };
	}

	if (kw === "emoji_stage") {
		const emoji = String(readScalar(ctx));
		return { kind: "emoji_stage", emoji };
	}

	if (kw === "clear") {
		const color = String(readScalar(ctx));
		return { kind: "clear", color };
	}

	if (kw === "raw_slot") {
		const id = ctx.readWord();
		return { kind: "raw_slot", id };
	}

	if (kw === "score_hud" || kw === "particles") {
		return { kind: kw };
	}

	if (kw === "sprite") {
		const id = ctx.readWord();
		ctx.skipWhitespaceAndComments();
		let emoji: string | undefined;
		if (ctx.peekWord() === "emoji") {
			ctx.readWord();
			emoji = String(readScalar(ctx));
		}
		return emoji !== undefined
			? { kind: "sprite", id, emoji }
			: { kind: "sprite", id };
	}

	const id = ctx.readWord();
	return { kind: kw as "toggle" | "slider" | "timer", id };
}

function parseHeroBlock(ctx: ParseContext): UiNode {
	const block = readBlockBody(ctx);
	const inner = nestedContext(ctx, block.body, block.start);
	let title: string | undefined;
	let blurb: string | undefined;
	let emoji: string | undefined;
	const children: UiNode[] = [];

	while (!inner.eof()) {
		inner.skipWhitespaceAndComments();
		if (inner.eof()) break;
		const kw = inner.peekWord();
		if (kw === "}") break;
		if (kw === "title") {
			inner.readWord();
			title = String(readScalar(inner));
			continue;
		}
		if (kw === "blurb") {
			inner.readWord();
			blurb = String(readScalar(inner));
			continue;
		}
		if (kw === "emoji") {
			inner.readWord();
			emoji = String(readScalar(inner));
			continue;
		}
		children.push(parseUiNode(inner));
	}

	return {
		kind: "hero",
		...(title !== undefined ? { title } : {}),
		...(blurb !== undefined ? { blurb } : {}),
		...(emoji !== undefined ? { emoji } : {}),
		children,
	};
}

type LayoutKind = "stack" | "grid" | "hero" | "card" | "modal" | "canvas" | "tabs";

function parseActionBlock(ctx: ParseContext): ActionBlock {
	const id = ctx.readWord();
	ctx.skipWhitespaceAndComments();
	const block = readBlockBody(ctx);
	const inner = nestedContext(ctx, block.body, block.start);
	const steps: ActionStep[] = [];

	while (!inner.eof()) {
		inner.skipWhitespaceAndComments();
		if (inner.eof()) break;
		const op = inner.readWord();
		if (!op) {
			if (inner.eof()) break;
			reportUnexpected(inner);
			continue;
		}

		if (op === "set") {
			const key = inner.readWord();
			const value = readScalar(inner);
			steps.push({ op: "set", key, value });
		} else if (op === "goto") {
			const scene = inner.readWord();
			steps.push({ op: "goto", scene });
		} else if (op === "back") {
			steps.push({ op: "back" });
		} else if (op === "toast") {
			const message = String(readScalar(inner));
			steps.push({ op: "toast", message });
		} else {
			const at = inner.spanAt(inner.pos - op.length);
			inner.diagnostics.push(
				diagnostic(
					inner.fileName,
					at.line,
					at.column,
					`Unknown action step "${op}"`,
					"Expected one of: set, goto, back, toast",
				),
			);
		}
	}

	return { id, steps };
}

function skipHorizontal(ctx: ParseContext): void {
	while (ctx.pos < ctx.source.length) {
		const ch = ctx.source[ctx.pos];
		if (ch === " " || ch === "\t" || ch === "\r") {
			ctx.pos += 1;
			continue;
		}
		break;
	}
}

function readLineWord(ctx: ParseContext): string {
	skipHorizontal(ctx);
	if (ctx.pos >= ctx.source.length) return "";
	const ch = ctx.source[ctx.pos];
	if (ch === "\n") return "";
	if (ch === "/" && ctx.source[ctx.pos + 1] === "/") {
		while (ctx.pos < ctx.source.length && ctx.source[ctx.pos] !== "\n") {
			ctx.pos += 1;
		}
		return "";
	}
	if (!isIdentStart(ch)) return "";
	const start = ctx.pos;
	ctx.pos += 1;
	while (ctx.pos < ctx.source.length && isIdentPart(ctx.source[ctx.pos])) {
		ctx.pos += 1;
	}
	return ctx.source.slice(start, ctx.pos);
}

function finishRawModuleLine(ctx: ParseContext): void {
	skipHorizontal(ctx);
	if (ctx.pos >= ctx.source.length || ctx.source[ctx.pos] === "\n") return;
	if (ctx.source[ctx.pos] === "/" && ctx.source[ctx.pos + 1] === "/") {
		while (ctx.pos < ctx.source.length && ctx.source[ctx.pos] !== "\n") {
			ctx.pos += 1;
		}
		return;
	}
	reportUnexpected(ctx);
	while (ctx.pos < ctx.source.length && ctx.source[ctx.pos] !== "\n") {
		ctx.pos += 1;
	}
}

function parseRawModuleLine(ctx: ParseContext): RawModuleBlock {
	const path = String(readScalar(ctx));
	const words: string[] = [];
	while (!ctx.eof()) {
		const w = readLineWord(ctx);
		if (!w) break;
		words.push(w);
	}
	finishRawModuleLine(ctx);
	let exportName = "";
	let slot = "";
	const exportIdx = words.indexOf("export");
	if (exportIdx >= 0 && words[exportIdx + 1]) {
		exportName = words[exportIdx + 1];
	}
	const intoIdx = words.indexOf("into");
	if (intoIdx >= 0 && words[intoIdx + 1] === "slot" && words[intoIdx + 2]) {
		slot = words[intoIdx + 2];
	}
	return { path, exportName, slot };
}
