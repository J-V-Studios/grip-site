import { expect, test } from "@playwright/test";

test("gripapps demo boots from the vendored runtime and waves", async ({
	page,
}) => {
	await page.route("https://lilgrip.com/gripapps/**", (route) => route.abort());
	await page.goto("/community/gripapps-demo/");
	await expect(page.locator(".grip-boundary")).toHaveCount(0);
	await expect(page.locator(".grip-shell-header")).toHaveText("Hello Grip");
	await page.getByRole("button", { name: "wave" }).click();
	await expect(page.locator(".grip-toast")).toContainText("you waved");
});
