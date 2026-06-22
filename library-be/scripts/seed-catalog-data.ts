/**
 * Seed Catalog Data — reads DATABASE_URL from .env via dotenv
 * Usage: npm run seed:catalog
 */
import "dotenv/config";
import { Pool } from "pg";
import crypto from "crypto";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("ERROR: DATABASE_URL not found in .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL });

async function seed() {
  console.log("=== MUCILIB Catalog Seed ===");
  console.log("Target:", DB_URL.replace(/\/\/.*@/, "//***@"));
  console.log("");

  const adminCheck = await pool.query("SELECT id FROM users WHERE email = 'admin@mucilib.ac.id'");
  if (adminCheck.rows.length === 0) {
    console.log("ERROR: Admin user not found. Run db:seed first.");
    await pool.end();
    process.exit(1);
  }
  console.log("Admin: OK");

  const existing = await pool.query("SELECT count(*) FROM bibliographies WHERE deleted_at IS NULL");
  if (Number(existing.rows[0].count) > 0) {
    console.log("Already seeded (" + existing.rows[0].count + " bibs). Done.");
    await pool.end();
    process.exit(0);
  }

  const locR = await pool.query("SELECT id FROM locations LIMIT 1");
  const locId = locR.rows[0]?.id;
  if (!locId) { console.log("ERROR: No locations. Run db:seed first."); await pool.end(); process.exit(1); }

  const gmdR = await pool.query("SELECT id FROM gmds LIMIT 1");
  const gmdId = gmdR.rows[0]?.id || 1;
  const ctR = await pool.query("SELECT id FROM collection_types LIMIT 1");
  const ctId = ctR.rows[0]?.id || 1;

  const books = [
    { title: "Pemrograman Web dengan JavaScript", isbn: "978-602-123-001-1", year: 2024, ed: "Edisi 3", auth: ["Budi Santoso"], subj: ["Pemrograman"], stock: 5 },
    { title: "Dasar-Dasar Psikologi Pendidikan", isbn: "978-602-123-002-8", year: 2023, ed: "Edisi 2", auth: ["Ani Wijayati"], subj: ["Psikologi"], stock: 3 },
    { title: "Manajemen Sumber Daya Manusia", isbn: "978-602-123-003-5", year: 2024, ed: "Edisi 1", auth: ["Rina Hartono", "Dedi Kurniawan"], subj: ["Manajemen"], stock: 4 },
    { title: "Teknik Informatika Dasar", isbn: "978-602-123-004-2", year: 2022, ed: "Edisi 4", auth: ["Ahmad Fauzi"], subj: ["Informatika"], stock: 2 },
    { title: "Bahasa Inggris untuk Pemula", isbn: "978-602-123-005-9", year: 2023, ed: "Edisi 1", auth: ["Sarah Johnson"], subj: ["Bahasa Inggris"], stock: 6 },
    { title: "Matematika Diskrit", isbn: "978-602-123-006-6", year: 2021, ed: "Edisi 2", auth: ["Dr. Surya"], subj: ["Matematika"], stock: 3 },
    { title: "Jaringan Komputer", isbn: "978-602-123-007-3", year: 2023, ed: "Edisi 1", auth: ["Bambang Riyanto"], subj: ["Jaringan"], stock: 4 },
    { title: "Basis Data Relasional", isbn: "978-602-123-008-0", year: 2022, ed: "Edisi 3", auth: ["Dewi Lestari", "Rudi Hartono"], subj: ["Basis Data"], stock: 2 },
    { title: "Kecerdasan Buatan", isbn: "978-602-123-009-7", year: 2024, ed: "Edisi 1", auth: ["Prof. Wibowo"], subj: ["AI"], stock: 3 },
    { title: "Statistika untuk Penelitian", isbn: "978-602-123-010-3", year: 2023, ed: "Edisi 2", auth: ["Dr. Rina", "Dr. Sari"], subj: ["Statistika"], stock: 5 },
  ];

  let bibN = 0, itemN = 0, authN = 0, subjN = 0;

  for (const b of books) {
    const br = await pool.query(
      "INSERT INTO bibliographies (title, isbn_issn, edition, publish_year, gmd_id, collection_type_id, type, stock, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,'physical_book',$7,NOW(),NOW()) ON CONFLICT DO NOTHING RETURNING id",
      [b.title, b.isbn, b.ed, b.year, 1, 1, b.stock]
    );
    if (br.rows.length === 0) continue;
    const bid = br.rows[0].id;
    bibN++;

    for (let i = 0; i < b.auth.length; i++) {
      const ar = await pool.query("INSERT INTO authors (name, normalized_name) VALUES ($1,$1) ON CONFLICT DO NOTHING RETURNING id", [b.auth[i].toLowerCase()]);
      const aid = ar.rows.length > 0 ? ar.rows[0].id : (await pool.query("SELECT id FROM authors WHERE name=$1", [b.auth[i]])).rows[0].id;
      await pool.query("INSERT INTO bibliography_authors (bibliography_id, author_id, role, position) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING", [bid, aid, i === 0 ? "primary" : "co-author", i + 1]);
      authN++;
    }

    for (const sn of b.subj) {
      const sr = await pool.query("INSERT INTO subjects (name, normalized_name) VALUES ($1,$1) ON CONFLICT DO NOTHING RETURNING id", [sn.toLowerCase()]);
      const sid = sr.rows.length > 0 ? sr.rows[0].id : (await pool.query("SELECT id FROM subjects WHERE name=$1", [sn])).rows[0].id;
      await pool.query("INSERT INTO bibliography_subjects (bibliography_id, subject_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [bid, sid]);
      subjN++;
    }

    for (let i = 0; i < Math.min(b.stock, 3); i++) {
      const code = "ITEM-" + b.isbn.slice(-4) + "-" + String(i + 1).padStart(2, "0");
      await pool.query("INSERT INTO items (bibliography_id, item_code, location_id, status, qr_token, qr_version, qr_generated_at, created_at, updated_at) VALUES ($1,$2,$3,'available',$4,1,NOW(),NOW(),NOW()) ON CONFLICT DO NOTHING", [bid, code, locId, crypto.randomBytes(20).toString("hex")]);
      itemN++;
    }
  }

  await pool.query("UPDATE bibliographies SET stock = (SELECT count(*) FROM items WHERE items.bibliography_id = bibliographies.id AND items.status = 'available' AND items.deleted_at IS NULL) WHERE deleted_at IS NULL");

  console.log("\n=== Done ===");
  console.log("Bibliographies:", bibN);
  console.log("Authors:", authN);
  console.log("Subjects:", subjN);
  console.log("Items:", itemN);
  await pool.end();
}

seed().catch((e) => { console.error("Failed:", e.message); pool.end(); process.exit(1); });
