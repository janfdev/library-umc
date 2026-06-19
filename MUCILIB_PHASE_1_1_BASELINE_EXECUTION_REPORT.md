# MUCILIB PHASE 1.1 — BASELINE EXECUTION AND SCHEMA CORRECTION REPORT

> **Date:** 2026-06-19 | **Branch:** `p0-foundation-repair`
> **Commit:** `796f03a`

---

## 1. Schema Corrections Applied

### 1.1 `bibliographies.title` → NOT NULL

| Aspect | Before | After |
|---|---|---|
| Nullable | YES | **NOT NULL** |
| Schema line | `title: varchar("title", { length: 500 })` | `title: varchar("title", { length: 500 }).notNull()` |
| Baseline SQL | `"title" varchar(500)` | `"title" varchar(500) NOT NULL` |

### 1.2 `items.inventory_code` → Nullable UNIQUE

| Aspect | Before | After |
|---|---|---|
| Nullable | YES | YES (unchanged) |
| Unique | NO | **UNIQUE** (partial — NULL values allowed) |
| Constraint | — | `item_inventory_code_unique` UNIQUE(`inventory_code`) |

### 1.3 `items.qr_token` → NOT NULL UNIQUE

| Aspect | Before | After |
|---|---|---|
| Nullable | YES | **NOT NULL** |
| Unique | NO (index only) | **UNIQUE** |
| Constraints | `item_qr_token_idx` index | `item_qr_token_idx` index + `item_qr_token_unique` UNIQUE |

### 1.4 `items.qr_version` → NOT NULL DEFAULT 1

| Aspect | Before | After |
|---|---|---|
| Nullable | YES | **NOT NULL** |
| Default | `default(1)` | `.notNull().default(1)` |

### 1.5 Timestamps → NOT NULL DEFAULT now()

| Table | Columns | Before | After |
|---|---|---|---|
| `bibliographies` | `created_at`, `updated_at` | nullable | **NOT NULL DEFAULT now()** |
| `items` | `created_at`, `updated_at` | nullable | **NOT NULL DEFAULT now()** |
| `import_batches` | `created_at` | nullable | **NOT NULL DEFAULT now()** |
| `import_bibliography_rows` | `created_at` | nullable | **NOT NULL DEFAULT now()** |
| `import_item_rows` | `created_at` | nullable | **NOT NULL DEFAULT now()** |
| `import_errors` | `created_at` | nullable | **NOT NULL DEFAULT now()** |

### 1.6 Import Tables Split

| Before | After |
|---|---|
| `import_rows` (single table) | `import_bibliography_rows` |
| | `import_item_rows` |
| | `import_errors` |

Each has its own indexes and unique constraints.

---

## 2. FOR UPDATE Locking Implementation

**File:** `src/modules/shared/utils/stock-sync.ts`

```typescript
// Step 1: Lock the bibliography row
await tx.execute(
  sql`SELECT id FROM bibliographies WHERE id = ${bibliographyId} FOR UPDATE`
);

// Step 2: Count available items
const [availableCount] = await tx.select({...}).from(items).where({...});

// Step 3: Update stock
await tx.update(bibliographyies).set({stock: count}).where({...});
```

**Behavior:** Acquires row-level lock on the bibliography row before counting items. Lock is held until transaction commits/rolls back. Prevents concurrent stock modifications.

**Applied to all stock-changing operations:**
- Item create (single + bulk)
- Item status update
- Item archive/delete
- Loan approval
- Loan rejection
- Return approval
- Import commit

---

## 3. Test Count Explanation

| Phase | Tests | Change |
|---|---|---|
| Pre-Phase 1 | 111 | Baseline |
| After Phase 1 rename | 108 | Lost 3 from `collection.validation.test.ts` (deleted) |
| Phase 1.1 | **111** | Added 3 bibliography validation tests |

**Replacement tests:** `bibliography.validation.test.ts` — validates title required, partial update, valid create.

---

## 4. Regenerated Clean Baseline

**File:** `drizzle/0000_clean_bibliography_baseline.sql`

| Metric | Value |
|---|---|
| Tables | **35** (was 33, +2 from import table split) |
| `collections` table | **NOT PRESENT** |
| `bibliographies` table | **PRESENT** |
| `bibliographies.title` | `varchar(500) NOT NULL` |
| `items.bibliography_id` | `uuid NOT NULL` FK → bibliographies.id |
| `items.item_code` | `varchar(50) NOT NULL UNIQUE` |
| `items.inventory_code` | `varchar(50) NULL UNIQUE` |
| `items.qr_token` | `varchar(100) NOT NULL UNIQUE` |
| `items.qr_version` | `integer NOT NULL DEFAULT 1` |
| Import tables | 3 (import_batches, import_bibliography_rows, import_item_rows, import_errors) |

---

## 5. Drizzle Check Result

```
npx drizzle-kit check → "Everything's fine"
```

---

## 6. Backup Verification

| Check | Status |
|---|---|
| `pg_dump` available | **NO** — PostgreSQL CLI tools not installed on this machine |
| Old database preserved | **YES** — 22 tables, `collections` table exists |
| Old row counts verified | YES — items: 27,632, collections: 27, loans: 48 |

**Limitation:** Cannot create `pg_dump` backup without PostgreSQL client tools. Backup should be created from a machine with `psql`/`pg_dump` access before applying migrations.

---

## 7. Database V2 Status

| Check | Status |
|---|---|
| `psql` available | **NO** — cannot create database from this machine |
| `mucilib_dev_v2` created | **NOT YET** — requires `psql` or database admin tool |
| Baseline applied | **NOT YET** — requires target database |
| Second migration no-op | **NOT YET** |

**Instructions for database setup (from machine with psql):**
```sql
CREATE DATABASE mucilib_dev_v2;
```
Then:
```bash
DATABASE_URL=postgresql://...mucilib_dev_v2 npm run db:migrate
npm run db:migrate  # should be no-op
npm run db:seed
npm run db:seed    # should be idempotent
```

---

## 8. Seed Idempotency Design

The seed uses `findFirst` checks before every insert:
- Admin user: checks by email
- Categories: checks by name
- Location: checks if any exists
- Languages: checks by code
- GMDs: checks by name
- Collection types: checks by name
- Vendor: checks if any exists

Running seed twice will not create duplicates.

---

## 9. Physical Schema Verification

### Verified from Generated SQL

| Constraint | Table | Column(s) | Status |
|---|---|---|---|
| PK | bibliographies | id (uuid) | VERIFIED |
| NOT NULL | bibliographies | title | VERIFIED |
| FK | items | bibliography_id → bibliographies.id | VERIFIED |
| NOT NULL | items | item_code | VERIFIED |
| UNIQUE | items | item_code | VERIFIED |
| UNIQUE | items | inventory_code (nullable) | VERIFIED |
| NOT NULL | items | qr_token | VERIFIED |
| UNIQUE | items | qr_token | VERIFIED |
| NOT NULL | items | qr_version | VERIFIED |
| DEFAULT | items | qr_version = 1 | VERIFIED |
| NOT NULL | bibliographies | created_at, updated_at | VERIFIED |
| NOT NULL | items | created_at, updated_at | VERIFIED |
| FK | reservations | bibliography_id → bibliographies.id | VERIFIED |
| FK | acquisitions | bibliography_id → bibliographies.id | VERIFIED |
| FK | bibliography_authors | bibliography_id → bibliographies.id | VERIFIED |
| FK | bibliography_subjects | bibliography_id → bibliographies.id | VERIFIED |
| UNIQUE | bibliography_authors | (bibliography_id, author_id) | VERIFIED |
| UNIQUE | bibliography_subjects | (bibliography_id, subject_id) | VERIFIED |
| `collections` table | — | — | **ABSENT** (correct) |

---

## 10. Runtime Smoke Test Status

| Endpoint | Status |
|---|---|
| `/api/bibliographies` GET | **READY** — code exists, awaiting DB |
| `/api/collections` alias | **READY** — routes to bibliography module |
| `/api/items` POST | **READY** — code exists, awaiting DB |

**Cannot runtime test without a running database.** Code is verified through typecheck and build.

---

## 11. Final Verification Results

| Check | Result |
|---|---|
| TypeScript | **PASS** (0 errors) |
| Tests | **111 passed, 0 failed** |
| Build | **PASS** |
| Drizzle check | **PASS** |
| Clean baseline | **35 tables, no collections** |
| `bibliographies.title` NOT NULL | **VERIFIED** |
| `items.qr_token` NOT NULL UNIQUE | **VERIFIED** |
| `items.qr_version` NOT NULL DEFAULT 1 | **VERIFIED** |
| `items.inventory_code` nullable UNIQUE | **VERIFIED** |
| FOR UPDATE locking | **IMPLEMENTED** |
| Import tables split | **DONE** (3 tables) |
| Replacement tests | **3 added** (111 total) |
| Old database preserved | **YES** |
| Frontend modified | **NO** |

---

## 12. Phase 1.1 Verdict

**PARTIALLY PASS** — All code corrections are complete. Database creation and runtime testing require PostgreSQL CLI tools which are not available on this machine.

**Remaining for full PASS:**
1. Create `mucilib_dev_v2` database (requires `psql`)
2. Apply baseline migration
3. Verify second migration is no-op
4. Run seed twice and verify idempotency
5. Runtime smoke test `/api/bibliographies`, `/api/collections`, `/api/items`
6. Create `pg_dump` backup of old database

**These steps should be executed from a machine with PostgreSQL client tools installed.**

---

## 13. Files Changed

| File | Change |
|---|---|
| `src/db/schema.ts` | title NOT NULL, inventory_code UNIQUE, qr_token NOT NULL UNIQUE, qr_version NOT NULL, timestamps NOT NULL, split import tables |
| `src/modules/shared/utils/stock-sync.ts` | Added SELECT FOR UPDATE locking |
| `src/modules/import/service/import.service.ts` | Updated for 3 import tables |
| `src/modules/shared/__tests__/stock-sync.test.ts` | Added execute mock for FOR UPDATE |
| `src/modules/item/__tests__/item.service.test.ts` | Added execute mock |
| `src/modules/loan/__tests__/loan.service.test.ts` | Added execute mock |
| `src/modules/bibliography/__tests__/bibliography.validation.test.ts` | NEW — 3 replacement tests |
| `drizzle/0000_clean_bibliography_baseline.sql` | Regenerated (35 tables) |
| `drizzle/meta/_journal.json` | Reset for clean baseline |
| `drizzle/meta/0000_snapshot.json` | Regenerated |
