import { db } from ".";
import {
  Users, account as accountTable, members, categories, locations, vendors,
  publishers, languages, publicationPlaces, gmds,
  collectionTypes, authors, subjects
} from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

const ADMIN_EMAIL = "admin@mucilib.ac.id";
const ADMIN_PASSWORD = "Admin123456!";

async function seed() {
  console.log("Seeding database...");

  // 1. Seed admin user
  const existingAdmin = await db.query.Users.findFirst({
    where: eq(Users.email, ADMIN_EMAIL),
  });
  
  let adminId: string;
  if (!existingAdmin) {
    const now = new Date();
    adminId = "admin-seed-001";
    await db.insert(Users).values({
      id: adminId,
      name: "Super Admin",
      email: ADMIN_EMAIL,
      emailVerified: true,
      role: "super_admin",
      createdAt: now,
      updatedAt: now,
    });
    console.log("Created admin user");
  } else {
    adminId = existingAdmin.id;
    console.log("Admin user already exists");
  }

  // 1b. Ensure admin has credential account for Better Auth login
  const existingAccount = await db.query.account.findFirst({
    where: eq(accountTable.userId, adminId),
  });
  if (!existingAccount) {
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
    const now = new Date();
    await db.insert(accountTable).values({
      id: `account-${adminId}-credential`,
      accountId: ADMIN_EMAIL,
      providerId: "credential",
      userId: adminId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });
    console.log("Created admin credential account");
  } else {
    console.log("Admin credential account already exists");
  }

  // 2. Seed categories
  const categoryNames = [
    "Pendidikan", "Psikologi", "PAUD", "FAI", "BK",
    "Komunikasi", "Pemerintahan", "Umum", "Bahasa Inggris", "Matematika"
  ];
  for (const name of categoryNames) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.name, name),
    });
    if (!existing) {
      await db.insert(categories).values({ name });
    }
  }
  console.log(`Seeded ${categoryNames.length} categories`);

  // 3. Seed default location
  const existingLoc = await db.query.locations.findFirst();
  if (!existingLoc) {
    await db.insert(locations).values({
      room: "UMC Library",
      rack: "Rak Utama",
      shelf: "Lantai 1",
    });
    console.log("Created default location");
  } else {
    console.log("Default location already exists");
  }

  // 4. Seed languages
  const langData = [
    { code: "id", name: "Indonesia" },
    { code: "en", name: "English" },
    { code: "ar", name: "Arabic" },
    { code: "ms", name: "Malay" },
  ];
  for (const lang of langData) {
    const existing = await db.query.languages.findFirst({
      where: eq(languages.code, lang.code),
    });
    if (!existing) {
      await db.insert(languages).values(lang);
    }
  }
  console.log(`Seeded ${langData.length} languages`);

  // 5. Seed GMDs
  const gmdNames = ["Text", "Electronic", "Audio", "Video", "Image", "Map", "Mixed"];
  for (const name of gmdNames) {
    const existing = await db.query.gmds.findFirst({
      where: eq(gmds.name, name),
    });
    if (!existing) {
      await db.insert(gmds).values({ name });
    }
  }
  console.log(`Seeded ${gmdNames.length} GMDs`);

  // 6. Seed collection types
  const ctData = [
    { name: "Text", code: "Text" },
    { name: "Pendidikan", code: "Pendidikan" },
    { name: "Psikologi", code: "Psikologi" },
    { name: "PAUD", code: "PAUD" },
    { name: "FAI", code: "FAI" },
    { name: "BK", code: "BK" },
    { name: "Komunikasi", code: "Komunikasi" },
    { name: "Pemerintahan", code: "Pemerintahan" },
    { name: "Umum", code: "Umum" },
    { name: "Bahasa Inggris", code: "Bahasa Inggris" },
    { name: "Matematika", code: "Matematika" },
  ];
  for (const ct of ctData) {
    const existing = await db.query.collectionTypes.findFirst({
      where: eq(collectionTypes.name, ct.name),
    });
    if (!existing) {
      await db.insert(collectionTypes).values(ct);
    }
  }
  console.log(`Seeded ${ctData.length} collection types`);

  // 7. Seed default vendor
  const existingVendor = await db.query.vendors.findFirst();
  if (!existingVendor) {
    await db.insert(vendors).values({
      name: "UMC Library",
      contact: "library@umc.ac.id",
    });
    console.log("Created default vendor");
  } else {
    console.log("Default vendor already exists");
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed();
