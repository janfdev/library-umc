import { test as setup, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../playwright/.auth/admin.json");

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);

  const emailInput = page.locator('input[placeholder="Masukkan email"]');
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await emailInput.fill("admin@mucilib.ac.id");

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 15000 });
  await passwordInput.fill("Admin123456!");

  await page.getByRole("button", { name: /masuk ke perpustakaan/i }).click();

  await page.waitForFunction(() => window.location.pathname.includes("/dashboard"), { timeout: 30000 });
  await page.waitForTimeout(3000);

  await page.context().storageState({ path: authFile });
});
