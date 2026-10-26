import { expect, test } from "@playwright/test";

test("home and explore routes render", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: /lilgrip/i })).toBeVisible();
	await page.getByRole("link", { name: "Church Apps" }).first().click();
	await expect(page.getByText(/Church apps coming soon/i)).toBeVisible();
	await page.goto("/fun-apps");
	await expect(
		page.getByText(/Fun projects and games coming soon/i),
	).toBeVisible();
	await page.goto("/about");
	await expect(page.getByText(/About page coming soon/i)).toBeVisible();
	await page.goto("/money");
	await expect(
		page.getByText(/Financial tools and ideas coming soon/i),
	).toBeVisible();
});
