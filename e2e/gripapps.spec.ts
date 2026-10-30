import { expect, test } from "@playwright/test";

test("gripapps demo boots visual play (hero, canvas, no boundary)", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.route("https://lilgrip.com/gripapps/**", (route) => route.abort());
	await page.goto("/community/gripapps-demo/");
	await expect(page.locator(".grip-boundary")).toHaveCount(0);
	await expect(page.locator(".grip-hero")).toBeVisible();
	await expect(page.locator(".grip-hero-title")).toHaveText("Laser Lagoon");
	await expect(page.locator(".grip-hero-bleed")).toBeVisible();
	await expect(page.locator(".grip-canvas")).toBeVisible();
	await expect(page.locator(".grip-hero-emoji")).toContainText("🦈");
	page.getByRole("button", { name: "dash!" }).click();
	await expect(page.locator(".grip-score-hud")).toHaveText("Score: 3");
});
