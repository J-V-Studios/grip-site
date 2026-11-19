import { expect, test } from "@playwright/test";

test("resume home renders key sections", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: "Your Name" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Experience" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
	await expect(
		page.getByRole("link", { name: "See experience" }),
	).toBeVisible();
});
