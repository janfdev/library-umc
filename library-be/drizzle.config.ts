import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const dbUrl = new URL(process.env.DATABASE_URL!);
dbUrl.searchParams.delete("sslmode");
dbUrl.searchParams.delete("channel_binding");

export default defineConfig({
  out: "./drizzle/",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl.toString(),
  },
});
