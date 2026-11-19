import { expect, test } from "@playwright/test";

test("legacy community route redirects to resume home", async ({ page }) => {
	await page.goto("/community");
	await expect(page).toHaveURL(/\/$/);
	await expect(
		page.getByRole("heading", { name: "Josiah Eveland" }),
	).toBeVisible();
});
