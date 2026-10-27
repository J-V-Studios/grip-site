import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Relative base so assets work at /community/<handle>/ on GitHub Pages
export default defineConfig({
	base: "./",
	plugins: [react()],
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
});
