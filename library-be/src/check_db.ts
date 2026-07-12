import { db } from "./db";
import { items, locations } from "./db/schema";
import { isNull } from "drizzle-orm";

async function main() {
  console.log("Checking DB locations and items...");
  const locs = await db.select().from(locations);
  console.log("Locations in DB:", locs);

  const rawItems = await db.query.items.findMany({
    with: { location: true }
  });
  console.log("Sample items (up to 5):", rawItems.slice(0, 5));
  process.exit(0);
}

main().catch(console.error);
