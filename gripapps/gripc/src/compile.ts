import type { Diagnostic } from "./diagnostics";
import { emitGripAppJs, GRIP_APP_API_VERSION } from "./codegen";
import type { GripManifestMeta } from "./manifest";
import { parseGrip } from "./parse";
import { validateGrip } from "./validate";

export type CompileOk = {
	ok: true;
	js: string;
	manifest: GripManifestMeta;
	apiVersion: number;
};

export type CompileErr = {
	ok: false;
	diagnostics: Diagnostic[];
};

export type CompileResult = CompileOk | CompileErr;

export function compileGripSource(
	source: string,
	fileName: string,
): CompileResult {
	const parsed = parseGrip(source, fileName);
	if (!parsed.ok) {
		return { ok: false, diagnostics: parsed.diagnostics };
	}

	const diagnostics = validateGrip(parsed.ast, fileName);
	if (diagnostics.length > 0) {
		return { ok: false, diagnostics };
	}

	const js = emitGripAppJs(parsed.ast);
	return {
		ok: true,
		js,
		manifest: {
			title: parsed.ast.meta.title,
			blurb: parsed.ast.meta.blurb,
			theme: parsed.ast.meta.theme,
		},
		apiVersion: GRIP_APP_API_VERSION,
	};
}
