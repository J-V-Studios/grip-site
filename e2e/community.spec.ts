import { expect, test } from "@playwright/test";

test("community hub renders heading", async ({ page }) => {
	await page.goto("/community");
	await expect(
		page.getByRole("heading", { name: /community builds/i }),
	).toBeVisible();
});

test("community gallery lists shipped pages", async ({ page }) => {
	await page.goto("/community");
	await expect(
		page.getByRole("heading", { name: /community pages/i }),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: /@smoke-authfix-2124/i }),
	).toBeVisible();
});
