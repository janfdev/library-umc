import { db } from "./db";
import { bibliographies } from "./db/schema";

async function main() {
  const firstBib = await db.query.bibliographies.findFirst({
    where: (bib, { isNull }) => isNull(bib.deletedAt)
  });
  if (!firstBib) {
    console.log("No bibliography found.");
    process.exit(0);
  }

  const url = `http://localhost:4000/api/bibliographies/${firstBib.id}`;
  console.log(`Fetching from API: ${url}`);
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log("API Success:", json.success);
    console.log("Returned items location sample:", json.data?.items?.[0]?.location);
  } catch (err) {
    console.error("API error:", err);
  }
  process.exit(0);
}

main().catch(console.error);
