import { expect, test } from "@playwright/test";

test("gripapps demo boots without error boundary", async ({ page }) => {
	await page.goto("/community/gripapps-demo/");
	await expect(page.getByText(/error boundary|hiccuped/i)).toHaveCount(0);
	await expect(page.locator("#grip-root, [data-grip-root]")).toBeVisible();
});
