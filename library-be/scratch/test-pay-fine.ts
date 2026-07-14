import { db } from "../src/db";
import { fines, Users } from "../src/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import finesService from "../src/modules/fines/service/fines.service";

async function test() {
  try {
    console.log("Searching for unpaid fines...");
    const unpaidFine = await db.query.fines.findFirst({
      where: and(eq(fines.status, "unpaid"), isNull(fines.deletedAt)),
    });

    if (!unpaidFine) {
      console.log("No unpaid fines found in database.");
      return;
    }

    console.log("Found unpaid fine:", unpaidFine);

    console.log("Searching for an admin user...");
    const admin = await db.query.Users.findFirst({
      where: eq(Users.role, "super_admin"),
    });

    if (!admin) {
      console.log("No admin user found in database.");
      return;
    }

    console.log("Found admin:", admin.id, admin.name);

    console.log("Attempting to pay fine...");
    const result = await finesService.payFine(unpaidFine.id, admin.id, "cash");
    console.log("Pay fine result:", result);
  } catch (err: any) {
    console.error("Error occurred during test:", err);
  } finally {
    process.exit(0);
  }
}

test();
