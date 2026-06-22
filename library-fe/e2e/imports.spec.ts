import { test, expect } from "@playwright/test";

test("import section", async ({ page }) => {
  await page.goto("/dashboard/super-admin", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  await page.locator('[data-sidebar="sidebar"]').getByText("Import Data").first().click();
  await page.waitForTimeout(3000);
  await expect(page.getByRole("heading", { name: "Import Data" }).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Upload File CSV").first()).toBeVisible();
});
