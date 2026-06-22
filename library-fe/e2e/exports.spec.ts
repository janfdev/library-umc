import { test, expect } from "@playwright/test";

test("export section", async ({ page }) => {
  await page.goto("/dashboard/super-admin", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  await page.locator('[data-sidebar="sidebar"]').getByText("Export Data").first().click();
  await page.waitForTimeout(3000);
  await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible({ timeout: 10000 });
});
