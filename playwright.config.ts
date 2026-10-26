import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	use: {
		baseURL: "http://127.0.0.1:4321",
	},
	webServer: {
		command: "bunx --bun astro preview --host 127.0.0.1 --port 4321",
		url: "http://127.0.0.1:4321",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
