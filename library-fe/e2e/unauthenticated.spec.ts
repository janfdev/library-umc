import { test, expect } from "@playwright/test";

test("unauthenticated user sees login", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await expect(page.getByText("Selamat Datang")).toBeVisible({ timeout: 10000 });
  await expect(page.getByPlaceholder("Masukkan email")).toBeVisible();
});
