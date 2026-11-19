import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://lilgrip.com",
	output: "static",
	integrations: [react(), sitemap()],
	redirects: {
		"/about": "/",
		"/church-apps": "/",
		"/fun-apps": "/",
		"/money": "/",
		"/community": "/",
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
