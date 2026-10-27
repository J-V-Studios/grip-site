import { expect, test } from "@playwright/test";

test("community hub renders heading", async ({ page }) => {
	await page.goto("/community");
	await expect(
		page.getByRole("heading", { name: /community builds/i }),
	).toBeVisible();
});
