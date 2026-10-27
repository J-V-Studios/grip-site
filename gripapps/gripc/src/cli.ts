#!/usr/bin/env bun
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { renderBootHtml } from "./boot-html";
import { compileGripSource } from "./compile";
import type { Diagnostic } from "./diagnostics";
import { mergeBuildManifest, type GripBuildManifest } from "./manifest";
import { vendorRuntime } from "./vendor";

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
  gripc check <file>
  gripc build <file> --out <dir> --handle <handle>
  gripc vendor-runtime --out <dir>`);
}

function parseArgs(argv: string[]): {
	command: "check" | "build" | "vendor-runtime" | null;
	file: string | null;
	outDir: string | null;
	handle: string | null;
} {
	const [, , command, ...rest] = argv;
	let file: string | null = null;
	let outDir: string | null = null;
	let handle: string | null = null;

	if (command === "vendor-runtime") {
		for (let i = 0; i < rest.length; i++) {
			const arg = rest[i];
			if (arg === "--out" && rest[i + 1]) {
				outDir = rest[++i];
			}
		}
		return { command: "vendor-runtime", file: null, outDir, handle };
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

	const cmd =
		command === "check" || command === "build" ? command : null;
	return { command: cmd, file, outDir, handle };
}

async function cmdCheck(file: string): Promise<number> {
	const source = await readFile(file, "utf8");
	const result = compileGripSource(source, file);
	if (!result.ok) {
		printDiagnostics(result.diagnostics);
		return 1;
	}
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
		version: DEFAULT_RUNTIME_VERSION,
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
	const { command, file, outDir, handle } = parseArgs(process.argv);

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
		return cmdCheck(file);
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
