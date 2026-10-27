import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const RUNTIME_REL = "public/gripapps/runtime.js";
const VERSION_REL = "public/gripapps/VERSION";

export async function vendorRuntime(
	repoRoot: string,
	outDir: string,
): Promise<void> {
	const vendorDir = join(outDir, "vendor", "gripapps");
	await mkdir(vendorDir, { recursive: true });
	await copyFile(join(repoRoot, RUNTIME_REL), join(vendorDir, "runtime.js"));
	await copyFile(join(repoRoot, VERSION_REL), join(vendorDir, "VERSION"));
}
