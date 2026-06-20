import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const testUrl = process.env.TEST_DATABASE_URL;

if (!testUrl) {
  throw new Error("TEST_DATABASE_URL is required for test configuration");
}

// Safety guard: refuse to use production URLs
if (testUrl === process.env.DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL");
}

const url = new URL(testUrl);
if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
  throw new Error("TEST_DATABASE_URL must use localhost");
}
if (!url.pathname.includes("test")) {
  throw new Error("TEST_DATABASE_URL database name must contain 'test'");
}

export default defineConfig({
  out: "./drizzle/",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: testUrl,
  },
});
