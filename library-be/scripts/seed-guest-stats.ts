import { db } from "../src/db";
import { guestLogs } from "../src/db/schema";
import { sql } from "drizzle-orm";

const FACULTIES = [
  "Fakultas Teknik", "Fakultas Ekonomi", "Fakultas Hukum",
  "Fakultas Psikologi", "Fakultas Bahasa", "Fakultas MIPA"
];

const NAMES = [
  "Budi Santoso", "Ani Wijayati", "Rina Hartono", "Dedi Kurniawan",
  "Sarah Johnson", "Ahmad Fauzi", "Dewi Lestari", "Bambang Riyanto",
  "Dr. Surya", "Rudi Hartono", "Prof. Wibowo", "Dr. Rina",
  "Siti Nurhaliza", "Agus Pratama", "Maya Putri", "Hendra Wijaya",
  "Lestari Sari", "Rizki Ramadhan", "Putri Amelia", "Fajar Nugroho"
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedGuestStats() {
  console.log("Seeding guest visit data...");

  const rows: typeof guestLogs.$inferInsert[] = [];
  const now = new Date();

  // Seed 30 days of data
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);

    // More visitors on weekdays, fewer on weekends
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseCount = isWeekend ? rand(3, 8) : rand(8, 25);

    for (let i = 0; i < baseCount; i++) {
      // Spread visits across working hours (8:00 - 17:00)
      const hour = rand(8, 17);
      const minute = rand(0, 59);
      const visitDate = new Date(date);
      visitDate.setHours(hour, minute, 0, 0);

      const name = pick(NAMES);
      rows.push({
        name,
        identifier: `ID-${String(rand(1000, 9999))}`,
        email: `${name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10)}${rand(1, 99)}@student.umc.ac.id`,
        faculty: pick(FACULTIES),
        major: pick(["Teknik Informatika", "Manajemen", "Akuntansi", "Psikologi", "Bahasa Inggris"]),
        visitDate,
      });
    }
  }

  // Insert in batches of 50
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    await db.insert(guestLogs).values(batch);
    inserted += batch.length;
    process.stdout.write(`\r  Inserted ${inserted}/${rows.length}...`);
  }

  console.log(`\nDone! Seeded ${rows.length} visitor records for the last 30 days.`);
}

async function main() {
  try {
    await seedGuestStats();
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
  process.exit(0);
}

main();
