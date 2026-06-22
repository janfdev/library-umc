import { defineConfig, devices } from "@playwright/test";

const BACKEND_PORT = "4100";
const FRONTEND_PORT = "5174";
const TEST_DB = "postgresql://mucilib_test:mucilib_test_password@localhost:55432/mucilib_test";
const CHROMIUM = "C:\\Users\\Admin\\AppData\\Local\\ms-playwright\\chromium-1200\\chrome-win64\\chrome.exe";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 60000,
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    screenshot: "only-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { launchOptions: { executablePath: CHROMIUM } },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
        launchOptions: { executablePath: CHROMIUM },
      },
      dependencies: ["setup"],
      testIgnore: /unauthenticated\.spec\.ts/,
    },
    {
      name: "unauth",
      testMatch: /unauthenticated\.spec\.ts/,
      use: { launchOptions: { executablePath: CHROMIUM } },
    },
  ],
  webServer: [
    {
      name: "backend",
      command: `cmd /c "set DATABASE_URL=${TEST_DB}&&set PORT=${BACKEND_PORT}&&set NODE_ENV=test&&set BETTER_AUTH_SECRET=test-secret&&set BETTER_AUTH_URL=http://localhost:${BACKEND_PORT}&&set FRONTEND_URL=http://localhost:${FRONTEND_PORT}&&cd /d ..\\library-be && npx tsx src/index.ts"`,
      url: `http://localhost:${BACKEND_PORT}/health`,
      timeout: 30000,
      reuseExistingServer: true,
    },
    {
      name: "frontend",
      command: `cmd /c "set VITE_API_URL=http://localhost:${BACKEND_PORT}&&set VITE_BETTER_AUTH_URL=http://localhost:${BACKEND_PORT}&&set VITE_BASE_URL=http://localhost:${FRONTEND_PORT}&&npx vite --port ${FRONTEND_PORT} --strictPort"`,
      url: `http://localhost:${FRONTEND_PORT}`,
      timeout: 30000,
      reuseExistingServer: true,
    },
  ],
});
