#!/usr/bin/env bun
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { renderBootHtml } from "./boot-html";
import { compileGripSource } from "./compile";
import type { Diagnostic } from "./diagnostics";
import { mergeBuildManifest, type GripBuildManifest } from "./manifest";
import { enrichGripFile, printEnrichNextSteps } from "./enrich";
import { parseGrip } from "./parse";
import { vendorRuntime } from "./vendor";
import { isVisuallyThin, visualThinHint } from "./visual";

const DEFAULT_RUNTIME_VERSION = "1";

function printDiagnostics(diags: Diagnostic[]): void {
	for (const d of diags) {
		const loc = `${d.file}:${d.line}:${d.column}`;
		const hint = d.hint ? ` (${d.hint})` : "";
		console.error(`${loc}: ${d.message}${hint}`);
	}
}

function usage(): void {
	console.error(`Usage:
  gripc check [--visual] <file>
  gripc enrich <file>
  gripc build <file> --out <dir> --handle <handle>
  gripc vendor-runtime --out <dir>`);
}

function parseArgs(argv: string[]): {
	command: "check" | "build" | "vendor-runtime" | "enrich" | null;
	file: string | null;
	outDir: string | null;
	handle: string | null;
	visual: boolean;
} {
	const [, , command, ...rest] = argv;
	let file: string | null = null;
	let outDir: string | null = null;
	let handle: string | null = null;
	let visual = false;

	if (command === "vendor-runtime") {
		for (let i = 0; i < rest.length; i++) {
			const arg = rest[i];
			if (arg === "--out" && rest[i + 1]) {
				outDir = rest[++i];
			}
		}
		return { command: "vendor-runtime", file: null, outDir, handle, visual };
	}

	if (command === "check" || command === "enrich") {
		const positional: string[] = [];
		for (const arg of rest) {
			if (arg === "--visual") {
				visual = true;
			} else {
				positional.push(arg);
			}
		}
		file = positional[0] ?? null;
		const cmd = command === "check" || command === "enrich" ? command : null;
		return { command: cmd, file, outDir, handle, visual };
	}

	file = rest[0] ?? null;
	const opts = rest.slice(1);
	for (let i = 0; i < opts.length; i++) {
		const arg = opts[i];
		if (arg === "--out" && opts[i + 1]) {
			outDir = opts[++i];
		} else if (arg === "--handle" && opts[i + 1]) {
			handle = opts[++i];
		}
	}

	const cmd = command === "build" ? command : null;
	return { command: cmd, file, outDir, handle, visual };
}

async function cmdCheck(file: string, visual: boolean): Promise<number> {
	const source = await readFile(file, "utf8");
	const result = compileGripSource(source, file);
	if (!result.ok) {
		printDiagnostics(result.diagnostics);
		return 1;
	}
	if (visual) {
		const parsed = parseGrip(source, file);
		if (parsed.ok && isVisuallyThin(parsed.ast)) {
			console.error(visualThinHint(`gripc enrich ${file}`));
			return 1;
		}
	}
	return 0;
}

async function cmdEnrich(file: string): Promise<number> {
	const result = await enrichGripFile(file);
	if (!result.ok) {
		printDiagnostics(result.diagnostics);
		return 1;
	}
	console.log(`Wrote ${result.notesPath}`);
	printEnrichNextSteps();
	return 0;
}

async function readExistingManifest(
	path: string,
): Promise<Partial<GripBuildManifest> | null> {
	try {
		const raw = await readFile(path, "utf8");
		return JSON.parse(raw) as Partial<GripBuildManifest>;
	} catch {
		return null;
	}
}

async function readRuntimeVersion(repoRoot: string): Promise<string> {
	try {
		const raw = await readFile(
			join(repoRoot, "public/gripapps/VERSION"),
			"utf8",
		);
		const trimmed = raw.trim();
		return trimmed || DEFAULT_RUNTIME_VERSION;
	} catch {
		return DEFAULT_RUNTIME_VERSION;
	}
}

async function cmdBuild(
	file: string,
	outDir: string,
	handle: string,
): Promise<number> {
	const source = await readFile(file, "utf8");
	const result = compileGripSource(source, file);
	if (!result.ok) {
		printDiagnostics(result.diagnostics);
		return 1;
	}

	await mkdir(outDir, { recursive: true });

	const jsPath = join(outDir, "app.grip.js");
	await writeFile(jsPath, result.js, "utf8");

	const html = renderBootHtml({
		handle,
		version: await readRuntimeVersion(process.cwd()),
		title: result.manifest.title,
	});
	await writeFile(join(outDir, "index.html"), html, "utf8");

	const manifestPath = join(outDir, "manifest.json");
	const existing = await readExistingManifest(manifestPath);
	const builtAt = new Date().toISOString();
	const manifest = mergeBuildManifest(existing, {
		handle,
		title: result.manifest.title,
		blurb: result.manifest.blurb,
		builtAt,
	});
	await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

	await vendorRuntime(process.cwd(), outDir);

	console.log(`Wrote ${jsPath}`);
	console.log(`Wrote ${join(outDir, "index.html")}`);
	console.log(`Wrote ${manifestPath}`);
	console.log(`Wrote ${join(outDir, "vendor/gripapps/runtime.js")}`);
	return 0;
}

async function cmdVendorRuntime(outDir: string): Promise<number> {
	await mkdir(outDir, { recursive: true });
	await vendorRuntime(process.cwd(), outDir);
	console.log(`Vendored runtime to ${join(outDir, "vendor/gripapps")}`);
	return 0;
}

async function main(): Promise<number> {
	const { command, file, outDir, handle, visual } = parseArgs(process.argv);

	if (!command) {
		usage();
		return 1;
	}

	if (command === "vendor-runtime") {
		if (!outDir) {
			console.error("vendor-runtime requires --out <dir>");
			usage();
			return 1;
		}
		return cmdVendorRuntime(outDir);
	}

	if (!file) {
		usage();
		return 1;
	}

	if (command === "check") {
		return cmdCheck(file, visual);
	}

	if (command === "enrich") {
		return cmdEnrich(file);
	}

	if (!outDir || !handle) {
		console.error("build requires --out <dir> and --handle <handle>");
		usage();
		return 1;
	}

	return cmdBuild(file, outDir, handle);
}

main()
	.then((code) => process.exit(code))
	.catch((err: unknown) => {
		console.error(err);
		process.exit(1);
	});
