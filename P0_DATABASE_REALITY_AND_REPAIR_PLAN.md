# P0 DATABASE REALITY AND REPAIR PLAN

> **Date:** 2026-06-18 | **Branch:** `p0-foundation-repair`

---

## 1. Baseline Command Results

| Check | Result |
|---|---|
| Backend `npm install` | OK |
| Backend `tsc --noEmit` | PASS (0 errors) |
| Backend `vitest run` | 90 pass, 7 fail (pre-existing) |
| Backend `tsc && build` | PASS |
| Frontend `npm install` | OK |
| Frontend `tsc --noEmit` | PASS (0 errors) |
| Frontend `vitest run` | 8 pass, 0 fail |
| Frontend `tsc -b && vite build` | PASS |

### Pre-existing Test Failures (7)

| File | Test | Reason |
|---|---|---|
| `return-loan.test.ts` | (all) | No test suite — script file, not vitest |
| `auth.service.test.ts` | register success | Mock returns `undefined` for token |
| `auth.service.test.ts` | login success | Mock returns `undefined` for token |
| `loan.controller.test.ts` | request success | Expects 200, gets 400 (validation change) |
| `loan.controller.test.ts` | member not found | Error message text changed |
| `member.validation.test.ts` | nimNidn too short | Validation schema changed |
| `recommendation.validation.test.ts` | status validation (2 tests) | Schema export changed |

---

## 2. Live DB Inspection Result

**Connection:** Successful via `DATABASE_URL` in `.env`

| Check | Result |
|---|---|
| `return_requests` table | **EXISTS** |
| `member_type` enum values | `student, lecturer, staff, super_admin, external` |
| `return_request_status` enum | `pending, approved` |
| `acquisitions.created_at` type | `date` (not timestamp) |
| Total tables | 22 |
| Total enums | 14 (12 business + 2 pgcrypto) |
| Drizzle migrations applied | 3 (in `drizzle.__drizzle_migrations`) |

### All Live DB Enums

| Enum | Values |
|---|---|
| `collection_type` | physical_book, ebook, journal, thesis |
| `content_type` | text, pdf, url |
| `fines_status` | paid, unpaid |
| `item_status` | available, loaned, damaged, lost |
| `loans_status` | pending, approved, returned, extended, rejected |
| `logs_entity` | loan, item, fine, Users, category, collection, reservation, auth |
| `logs_status` | create, update, delete, approve, blacklist, failed_login, rate_limited |
| `member_card_status` | not_requested, pending, active, rejected, expired |
| `member_type` | student, lecturer, staff, super_admin, external |
| `recommendation_status` | pending, approved, rejected |
| `reservations_status` | waiting, fulfilled, canceled |
| `return_request_status` | pending, approved |

---

## 3. Schema.ts vs Migrations vs Live DB Matrix

| Item | schema.ts | Migrations | Live DB | Status |
|---|---|---|---|---|
| `return_requests` table | Defined | NOT in migration files | EXISTS | **MIGRATION FILE MISSING** but table exists (applied manually or via `db:push`) |
| `member_type` has `external` | Yes | NOT in migration files | EXISTS | **MIGRATION FILE MISSING** but value exists (applied manually or via `db:push`) |
| `acquisitions.created_at` | `date` | `date` (0000) | `date` | CONSISTENT — schema matches DB |
| `key_status`/`key_type` enums | NOT in schema.ts | NOT in migration files | EXISTS | pgcrypto system enums — ignore |
| Migrations 0006-0009 | N/A | SQL files exist | Only 3 in `__drizzle_migrations` | **JOURNAL DRIFT** — files exist but journal only tracks 0000-0005 |

---

## 4. Confirmed Defects

### DEFECT-1: `syncCollectionAvailableStock` duplicated
- **Location A:** `collection.service.ts:452-468`
- **Location B:** `loan.service.ts:22-38`
- **Risk:** Logic divergence if one is updated but not the other
- **Fix:** Extract to `shared/utils/stock-sync.ts`

### DEFECT-2: Item CRUD has NO stock sync
- `item.service.ts:createItem` (line 99) — inserts item, stock becomes stale
- `item.service.ts:updateItem` (line 148) — can change status without stock update
- `item.service.ts:deleteItem` (line 190) — soft-deletes without stock update
- **Fix:** Add `syncCollectionAvailableStock` calls to all three methods (in transaction)

### DEFECT-3: `acquisitions.created_at` is `date` not `timestamp`
- Schema.ts and DB both use `date`
- Inconsistent with all other tables using `timestamp`
- **Fix:** ALTER COLUMN to `timestamp` (safe — date→timestamp is widening, no data loss)

### DEFECT-4: Missing high-value indexes
- `reservations` — no index on `member_id`, `collection_id`, `status`
- `fines` — no index on `loan_id`, `status`
- `logs` — no index on `created_at`, `entity`, `action`
- **Fix:** Add indexes for query-supported columns

### DEFECT-5: Migration journal drift
- Migrations 0006-0009 exist as SQL files but are not in `_journal.json`
- Only 3 entries in `drizzle.__drizzle_migrations`
- **Fix:** Update `_journal.json` to include 0006-0009

---

## 5. False-Positive Findings from Previous Audit

| Previous Finding | Reality | Evidence |
|---|---|---|
| `return_requests` table missing from DB | **FALSE POSITIVE** | Live DB: table EXISTS |
| `external` enum value missing from `member_type` | **FALSE POSITIVE** | Live DB: value EXISTS |
| `acquisitions.created_at` type mismatch | **CONFIRMED** but consistent between schema.ts and DB | Both use `date` |

**Root cause of false positives:** Previous audit inferred DB state from migration files only. Migrations 0006-0009 were applied via `drizzle-kit push` (bypasses migration files), and `return_requests`/`external` were also applied this way.

---

## 6. Exact Additive Migrations Required

### MIG-1: Fix `acquisitions.created_at` type
```sql
ALTER TABLE "acquisitions" ALTER COLUMN "created_at" TYPE timestamp USING "created_at"::timestamp;
```
**Data safety:** Widening conversion (date→timestamp), no data loss. Existing dates become midnight timestamps.

### MIG-2: Add missing indexes
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS "reservations_member_idx" ON "reservations" ("member_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "reservations_collection_idx" ON "reservations" ("collection_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "reservations_status_idx" ON "reservations" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fines_loan_idx" ON "fines" ("loan_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fines_status_idx" ON "fines" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "logs_created_at_idx" ON "logs" ("created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "logs_entity_idx" ON "logs" ("entity");
```
**Data safety:** Additive only, no data modification.

### MIG-3: Fix migration journal
Update `drizzle/meta/_journal.json` to include migrations 0006-0009.

---

## 7. Stock Synchronization Repair Design

### Current State
```
collection.service.ts:452-468  →  syncCollectionAvailableStock (private)
loan.service.ts:22-38          →  syncCollectionAvailableStock (private, identical copy)
item.service.ts                →  NO stock sync at all
```

### Target State
```
shared/utils/stock-sync.ts     →  syncCollectionAvailableStock (exported)
collection.service.ts          →  imports from shared
loan.service.ts                →  imports from shared
item.service.ts                →  imports from shared, calls on create/update/delete
```

### Changes Required

| File | Change |
|---|---|
| NEW: `shared/utils/stock-sync.ts` | Extract `syncCollectionAvailableStock(tx, collectionId)` |
| `collection.service.ts` | Remove private method, import from shared |
| `loan.service.ts` | Remove private method, import from shared |
| `item.service.ts:createItem` | After insert, call `syncCollectionAvailableStock` in same tx |
| `item.service.ts:updateItem` | After update, call `syncCollectionAvailableStock` if status changed |
| `item.service.ts:deleteItem` | After soft-delete, call `syncCollectionAvailableStock` |

### Transaction Boundary
All item CRUD methods must wrap their operations in `db.transaction()` and pass `tx` to `syncCollectionAvailableStock`.

---

## 8. Tests Required

| Test | Priority | Type |
|---|---|---|
| `stock-sync.test.ts` — syncCollectionAvailableStock | HIGH | Unit |
| Item create → stock increments | HIGH | Service |
| Item delete → stock decrements | HIGH | Service |
| Item status change → stock updates | HIGH | Service |
| Loan approve → stock decrements | HIGH | Service (existing, verify) |
| Loan return → stock increments | HIGH | Service (existing, verify) |
| Transaction rollback on item create failure | MEDIUM | Service |

---

## 9. Rollback Plan

| Change | Rollback |
|---|---|
| MIG-1 (acquisitions type) | `ALTER TABLE acquisitions ALTER COLUMN created_at TYPE date` |
| MIG-2 (indexes) | `DROP INDEX` each index |
| MIG-3 (journal) | Restore original `_journal.json` from git |
| Stock sync extraction | Git revert — code-only change |
| Item stock sync addition | Git revert — code-only change |

---

## 10. Files to Modify

| File | Change Type |
|---|---|
| NEW: `src/modules/shared/utils/stock-sync.ts` | CREATE |
| `src/modules/collection/service/collection.service.ts` | MODIFY |
| `src/modules/loan/service/loan.service.ts` | MODIFY |
| `src/modules/item/service/item.service.ts` | MODIFY |
| `drizzle/0010_acquisitions_created_at_timestamp.sql` | CREATE |
| `drizzle/0011_missing_indexes.sql` | CREATE |
| `drizzle/meta/_journal.json` | MODIFY |
| NEW: `src/modules/shared/__tests__/stock-sync.test.ts` | CREATE |
| NEW: `src/modules/item/__tests__/item.service.test.ts` | CREATE |

---

## 11. Business Decisions Still Required

| # | Decision | Status |
|---|---|---|
| 1 | Keep `collections` name for P1 refactor? | DEFERRED to P1 |
| 2 | Should item create via API trigger stock sync? | **YES** — any item creation should update stock |
| 3 | Should item delete trigger stock sync? | **YES** — soft-delete reduces available stock |
| 4 | Should `CONCURRENTLY` be used for index creation? | **YES** — avoids table locks on large tables |
| 5 | Migrate journal to include 0006-0009? | **YES** — necessary for drizzle-kit consistency |
