# MUCILIB BACKEND TARGET GAP AUDIT

> **Date:** 2026-06-18 | **Branch:** `p0-foundation-repair`
> **Audit Type:** Delta audit against real repository for Bibliography + Item + QR + Import + Export refactor
> **No code, schema, migration, or database was modified during this audit.**

---

## 1. Executive Summary

MUCILIB is a university library system built on Express 5 + TypeScript + Drizzle ORM (PostgreSQL) + React 19. The current backend implements a flat `collections` table that conflates bibliographic metadata with inventory management. The approved target model separates these into `bibliographies` (catalog metadata) and `items` (physical copies with persistent QR).

**Critical gaps identified:**

| Area | Current State | Target State | Gap |
|---|---|---|---|
| Bibliography | `collections` table (14 fields) | Expanded with 9+ new fields, M:N authors/subjects | MISSING 9 fields, 4 normalization tables, 2 junction tables |
| Item | `items` table (9 fields) | 20+ fields including acquisition, QR, inventory | MISSING 11+ fields |
| QR | Loan verification only | Persistent per-item QR with resolve/scan/revoke | MISSING entire item QR system |
| Import | Single-step CSV/XLSX (max 10MB) | Staged import with validation, preview, approval | MISSING staging tables, validation pipeline, progress tracking |
| Export | Loan/fines CSV/PDF only | Senayan-compatible bibliography + item CSV | MISSING bibliography + item exporters entirely |
| Search | Basic title/author/isbn ilike, limit 100 | Full-text with subject, call number, GMD, language filters | MISSING advanced search, pagination, faceted filtering |
| Stock | Denormalized cache, duplicated sync logic | Authoritative stock service (already partially fixed in P0) | PARTIALLY FIXED |

**Prior P0 repairs (completed):**
- Stock sync extracted to shared utility (DEFECT-1 fixed)
- Item CRUD now triggers stock sync (DEFECT-2 fixed)
- `acquisitions.created_at` type corrected (DEFECT-3 fixed)
- Missing indexes added (DEFECT-4 fixed)
- All 111 tests passing, 0 failures

---

## 2. Verified Current Backend Baseline

### 2.1 Dependencies (VERIFIED from package.json)

| Package | Version | Purpose |
|---|---|---|
| express | ^5.2.1 | HTTP framework |
| drizzle-orm | ^0.45.1 | ORM |
| drizzle-kit | ^0.31.8 | Migration tooling |
| pg | ^8.17.2 | PostgreSQL driver |
| better-auth | ^1.5.5 | Authentication |
| zod | ^4.3.5 | Validation |
| qrcode | ^1.5.4 | QR generation |
| multer | ^2.1.1 | File upload |
| cloudinary | ^2.9.0 | Image storage |
| pdfkit | ^0.17.2 | PDF generation |
| exceljs | ^4.4.0 | Excel read/write |
| vitest | ^4.1.0 | Testing |
| resend | ^6.12.0 | Email |
| swagger-jsdoc | ^6.2.8 | API docs |
| csv-parser | NOT INSTALLED | MISSING for streaming CSV |
| bull/bullmq | NOT INSTALLED | MISSING for background jobs |
| ioredis | NOT INSTALLED | MISSING for job queue |

### 2.2 Scripts (VERIFIED)

| Script | Command |
|---|---|
| dev | `tsx watch src/index.ts` |
| build | `tsc && echo Build successfully finished!` |
| db:migrate | `npx drizzle-kit migrate` |
| db:push | `npx drizzle-kit push` |
| db:seed | `tsx src/db/seed.ts` |
| test | `vitest run` |
| **MISSING** | `db:generate` — team runs `npx drizzle-kit generate` directly |

### 2.3 Baseline Results (VERIFIED — run before audit)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS (0 errors) |
| `npx vitest run` | **111 passed, 0 failed** |
| `npm run build` | PASS |

### 2.4 Architecture Conventions (VERIFIED)

| Convention | Implementation |
|---|---|
| Auth | Better Auth cookie-based (`credentials: "include"`) |
| RBAC | `requireRole(["super_admin","staff"])` middleware |
| Error response | `{ success: false, message: string, data?: any }` |
| Success response | `{ success: true, message: string, data: T }` |
| Validation | Zod schemas in `validation/*.validation.ts` |
| Transactions | `db.transaction(async (tx) => { ... })` |
| Audit logging | `auditService.createLog({ action, entity, entityId, ... })` — **NOT used in collection/item/loan modules** |
| File upload | Multer memory storage → Cloudinary upload |
| Pagination | **INCONSISTENT** — some endpoints have it, most don't |

---

## 3. Current Database and Migration State

### 3.1 Tables (22 total, VERIFIED from live DB)

| Table | Rows | Soft Delete | Notes |
|---|---|---|---|
| `collections` | 27 | YES | Bibliography catalog |
| `items` | 27,632 | YES | Physical copies |
| `categories` | 10 | YES | Single-category per collection |
| `locations` | 1 | YES | Room/rack/shelf |
| `vendors` | 0 | YES | Not used |
| `acquisitions` | 0 | NO | Not used |
| `collection_contents` | 0 | YES | Digital content |
| `collection_views` | 0 | NO | Analytics |
| `loans` | 48 | YES | Loan transactions |
| `reservations` | 6 | YES | Reservation queue |
| `fines` | 42 | YES | Overdue fines |
| `transactions` | 29 | NO | Fine payments |
| `return_requests` | 4 | NO | Return approval workflow |
| `members` | 27 | YES | Library members |
| `recommendations` | 1 | YES | Lecturer recommendations |
| `logs` | 74 | NO | Audit trail |
| `guest_logs` | 10 | YES | Visitor registration |
| `users` | 51 | YES | Auth accounts |
| `session` | 792 | NO | Auth sessions |
| `account` | 52 | NO | OAuth accounts |
| `verification` | 0 | NO | Email verification |
| `web_traffic` | 10,435 | NO | Page visit analytics |

### 3.2 Migration State

- **Applied via `drizzle-kit migrate`:** 2 (0000, 0001)
- **Applied via `drizzle-kit push`:** 8 (0002–0009 + return_requests + external enum + member columns)
- **Pending:** 2 (0010, 0011 — created in P0 repair)
- **`drizzle/meta` gitignored:** YES — non-reproducible from git

---

## 4. Approved Target Backend Model

### Target ERD (Core)

```
bibliographies (expanded from collections)
├── id: uuid PK
├── isbn_issn: varchar(255) UNIQUE
├── title: varchar(500) NOT NULL
├── edition: varchar(100)
├── publisher_id: integer FK → publishers.id
├── publish_year: integer
├── collation: varchar(255)
├── series_title: varchar(255)
├── call_number: varchar(100)
├── language_id: integer FK → languages.id
├── place_id: integer FK → places.id
├── classification: varchar(100)
├── notes: text
├── image: text
├── sor: text
├── gmd_id: integer FK → gmds.id
├── description: text
├── type: collection_type enum
├── category_id: integer FK → categories.id
├── created_at, updated_at, deleted_at

publishers (NEW) | languages (NEW) | places (NEW) | gmds (NEW)
authors (NEW) | bibliography_authors (NEW - junction)
subjects (NEW) | bibliography_subjects (NEW - junction)

items (ENHANCED)
├── id: uuid PK
├── bibliography_id: uuid FK → bibliographies.id
├── item_code: varchar(50) UNIQUE (renamed from barcode)
├── inventory_code: varchar(50) UNIQUE (NEW)
├── call_number: varchar(100) (NEW, per-item override)
├── location_id: integer FK → locations.id
├── vendor_id: integer FK → vendors.id (NEW)
├── received_date: date (NEW)
├── order_no: varchar(100) (NEW)
├── order_date: date (NEW)
├── source: varchar(255) (NEW)
├── invoice: varchar(255) (NEW)
├── price: numeric(12,2) (NEW)
├── price_currency: varchar(10) (NEW, default 'IDR')
├── invoice_date: date (NEW)
├── site: varchar(255) (NEW)
├── coll_type_name: varchar(100) (NEW)
├── status: item_status enum
├── qr_token: varchar(100) UNIQUE (NEW)
├── qr_version: integer DEFAULT 1 (NEW)
├── qr_generated_at: timestamp (NEW)
├── qr_revoked_at: timestamp (NEW)
├── created_at, updated_at, deleted_at

import_batches (NEW)
├── id: uuid PK
├── type: enum (bibliography, item)
├── filename: varchar(255)
├── status: enum (uploading, validating, preview, approved, committed, failed)
├── total_rows: integer
├── processed_rows: integer
├── error_rows: integer
├── created_by: text FK → users.id
├── created_at, committed_at

import_rows (NEW)
├── id: uuid PK
├── batch_id: uuid FK → import_batches.id
├── row_number: integer
├── raw_data: jsonb
├── status: enum (pending, valid, invalid, committed, skipped)
├── errors: jsonb
├── resolved_id: uuid (FK to bibliography or item after commit)
├── created_at
```

---

## 5. Bibliography Source-to-Target Mapping

### Senayan → MUCILIB Field Matrix

| # | Senayan Header | Sample Value | Target Entity | Target Field | PG Type | Nullable | Unique | Index | Normalization | Current Field | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | title | "Algoritma dan Pemrograman" | bibliographies | title | varchar(500) | NO | NO | YES (GIN) | — | collections.title (varchar 255) | **MODIFY** — increase length, add NOT NULL, add GIN index |
| 2 | gmd_name | "Text" | bibliographies | gmd_id | integer FK | YES | NO | NO | → gmds table | — | **MISSING** — need gmds master table |
| 3 | edition | "Edisi 3" | bibliographies | edition | varchar(100) | YES | NO | NO | — | — | **MISSING** — new column |
| 4 | isbn_issn | "978-602-xxx" | bibliographies | isbn_issn | varchar(255) | YES | YES | YES | — | collections.isbn (varchar 255) | **RENAME** — add UNIQUE constraint |
| 5 | publisher_name | "Penerbit Informatika" | bibliographies | publisher_id | integer FK | YES | NO | NO | → publishers table | collections.publisher (varchar 150) | **NORMALIZE** — create publishers table |
| 6 | publish_year | "2023" | bibliographies | publish_year | integer | YES | NO | YES | — | collections.publication_year (varchar 100) | **MODIFY** — change to integer |
| 7 | collation | "xii, 350 hlm; 23 cm" | bibliographies | collation | varchar(255) | YES | NO | NO | — | — | **MISSING** — new column |
| 8 | series_title | "Informatika Series" | bibliographies | series_title | varchar(255) | YES | NO | NO | — | — | **MISSING** — new column |
| 9 | call_number | "005.1 ALG" | bibliographies | call_number | varchar(100) | YES | NO | YES | — | — | **MISSING** — new column |
| 10 | language_name | "Indonesia" | bibliographies | language_id | integer FK | YES | NO | NO | → languages table | — | **MISSING** — need languages master table |
| 11 | place_name | "Bandung" | bibliographies | place_id | integer FK | YES | NO | NO | → places table | — | **MISSING** — need places master table |
| 12 | classification | "005.1" | bibliographies | classification | varchar(100) | YES | NO | YES | — | — | **MISSING** — new column |
| 13 | notes | "Buku referensi..." | bibliographies | notes | text | YES | NO | NO | — | collections.description | **RENAME/MERGE** — description or notes |
| 14 | image | "cover.jpg" | bibliographies | image | text | YES | NO | NO | Cloudinary URL | collections.image | **KEEP** — already exists |
| 15 | sor | "Ahmad Fauzi, dkk." | bibliographies | sor | text | YES | NO | NO | — | — | **MISSING** — new column |
| 16 | authors | "Ahmad Fauzi;Budi Santoso" | bibliography_authors | author_id + role | junction | NO | composite PK | YES | → authors table (M:N) | collections.author (varchar 255, flat) | **NORMALIZE** — create authors + junction |
| 17 | topics | "Algoritma;Pemrograman;Komputer" | bibliography_subjects | subject_id | junction | NO | composite PK | YES | → subjects table (M:N) | categories (1:1) | **NORMALIZE** — create subjects + junction |
| 18 | item_code | "INV-001" | items | item_code | varchar(50) | YES | YES | YES | — | items.barcode (varchar 50) | **RENAME** |

### Multi-value Serialization Rules

| Field | Delimiter | Example | Import Behavior | Export Behavior |
|---|---|---|---|---|
| authors | `;` (semicolon) | "Ahmad Fauzi;Budi Santoso" | Split by `;`, trim, lookup/create in authors table, create junction | Join author names with `;` |
| topics | `;` (semicolon) | "Algoritma;Pemrograman" | Split by `;`, trim, lookup/create in subjects table, create junction | Join subject names with `;` |
| item_code | `;` (semicolon) | "INV-001;INV-002" | Split by `;`, each becomes a separate item row | Join item codes with `;` |

---

## 6. Item Source-to-Target Mapping

### Senayan → MUCILIB Field Matrix

| # | Senayan Header | Sample Value | Target Entity | Target Field | PG Type | Nullable | Unique | Index | Current Field | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | item_code | "INV-001" | items | item_code | varchar(50) | YES | YES | YES | items.barcode | **RENAME** |
| 2 | call_number | "005.1 ALG" | items | call_number | varchar(100) | YES | NO | YES | — | **MISSING** — per-item override |
| 3 | coll_type_name | "Text" | items | coll_type_name | varchar(100) | YES | NO | NO | — | **MISSING** — or derive from bibliography.type |
| 4 | inventory_code | "INV-2023-001" | items | inventory_code | varchar(50) | YES | YES | YES | — | **MISSING** — new column |
| 5 | received_date | "2023-01-15" | items | received_date | date | YES | NO | NO | — | **MISSING** — new column |
| 6 | supplier_name | "PT Gramedia" | items | vendor_id | integer FK | YES | NO | NO | vendors table (exists, unused) | **WIRE** — connect to existing vendors table |
| 7 | order_no | "PO-2023-001" | items | order_no | varchar(100) | YES | NO | NO | — | **MISSING** — new column |
| 8 | location_name | "Ruang A, Rak 1, Lantai 2" | items | location_id | integer FK | NO | NO | YES | items.location_id | **KEEP** — already exists |
| 9 | order_date | "2023-01-10" | items | order_date | date | YES | NO | NO | — | **MISSING** — new column |
| 10 | item_status_name | "Available" | items | status | item_status enum | NO | NO | YES | items.status | **KEEP** — needs value mapping |
| 11 | site | "Kampus Utama" | items | site | varchar(255) | YES | NO | NO | — | **MISSING** — new column |
| 12 | source | "APBN 2023" | items | source | varchar(255) | YES | NO | NO | — | **MISSING** — new column |
| 13 | invoice | "INV-2023-001" | items | invoice | varchar(255) | YES | NO | NO | — | **MISSING** — new column |
| 14 | price | "150000" | items | price | numeric(12,2) | YES | NO | NO | — | **MISSING** — new column |
| 15 | price_currency | "IDR" | items | price_currency | varchar(10) | YES | NO | NO | — | **MISSING** — new column, default 'IDR' |
| 16 | invoice_date | "2023-01-20" | items | invoice_date | date | YES | NO | NO | — | **MISSING** — new column |
| 17 | input_date | "2023-01-21" | items | created_at | timestamp | YES | NO | NO | items.created_at | **KEEP** — map directly |
| 18 | last_update | "2023-06-15" | items | updated_at | timestamp | YES | NO | NO | items.updated_at | **KEEP** — map directly |
| 19 | title | "Algoritma dan Pemrograman" | (via join) | bibliography.title | — | — | — | — | collections.title | **DERIVED** — join through bibliography_id |

### Status Value Mapping

| Senayan `item_status_name` | MUCILIB `item_status` | Notes |
|---|---|---|
| "Available" / "Tersedia" | `available` | Direct map |
| "Loaned" / "Dipinjam" | `loaned` | Direct map |
| "Damaged" / "Rusak" | `damaged` | Direct map |
| "Lost" / "Hilang" | `lost` | Direct map |
| "Missing" | `lost` | Alias |
| "In Processing" / "Dalam Proses" | `available` | Default to available |
| "Weeding" / "Dibuang" | `lost` | Map to lost (archive) |

---

## 7. Normalization Decisions

### 7.1 `publishers` — **CREATE**

| Aspect | Decision |
|---|---|
| Why | Senayan exports `publisher_name` as string. Normalizing prevents duplication and enables filtering. |
| Current equivalent | `collections.publisher` (varchar 150, inline) |
| Expected rows | ~500–2,000 (university library scale) |
| Unique constraint | `name` UNIQUE (case-insensitive via `LOWER(name)`) |
| Indexes | `name` GIN trigram for autocomplete |
| FK | `bibliographies.publisher_id → publishers.id` |
| Soft delete | YES |
| API | CRUD module or inline lookup endpoint |
| Separate CRUD | YES — `/api/publishers` with autocomplete |

### 7.2 `languages` — **CREATE**

| Aspect | Decision |
|---|---|
| Why | Senayan exports `language_name`. Standard ISO 639 codes needed. |
| Current equivalent | NONE |
| Expected rows | ~20–50 |
| Unique constraint | `code` UNIQUE (ISO 639-2), `name` UNIQUE |
| FK | `bibliographies.language_id → languages.id` |
| Soft delete | YES |
| Separate CRUD | No — seed + read-only lookup endpoint |

### 7.3 `places` — **CREATE**

| Aspect | Decision |
|---|---|
| Why | Senayan exports `place_name` (publication place). |
| Current equivalent | NONE |
| Expected rows | ~50–200 |
| Unique constraint | `name` UNIQUE |
| FK | `bibliographies.place_id → places.id` |
| Soft delete | YES |
| Separate CRUD | No — seed + read-only lookup endpoint |

### 7.4 `gmds` — **CREATE**

| Aspect | Decision |
|---|---|
| Why | Senayan exports `gmd_name` (General Material Designation). |
| Current equivalent | NONE (current `collections.type` is similar but different taxonomy) |
| Expected rows | ~10–20 |
| Unique constraint | `name` UNIQUE |
| FK | `bibliographies.gmd_id → gmds.id` |
| Soft delete | YES |
| Separate CRUD | No — seed + read-only lookup endpoint |

### 7.5 `authors` — **CREATE**

| Aspect | Decision |
|---|---|
| Why | Senayan exports `authors` as semicolon-delimited string. Need M:N for proper querying. |
| Current equivalent | `collections.author` (varchar 255, flat string) |
| Expected rows | ~1,000–5,000 |
| Unique constraint | `name` UNIQUE |
| Indexes | `name` GIN trigram for autocomplete |
| Junction | `bibliography_authors(bibliography_id, author_id, role)` |
| Soft delete | YES |
| Separate CRUD | YES — `/api/authors` with autocomplete |

### 7.6 `subjects` — **CREATE**

| Aspect | Decision |
|---|---|
| Why | Senayan exports `topics` as semicolon-delimited string. Need M:N for filtering. |
| Current equivalent | `categories` (1:1 per collection, different taxonomy) |
| Expected rows | ~200–1,000 |
| Unique constraint | `name` UNIQUE |
| Indexes | `name` GIN trigram for autocomplete |
| Junction | `bibliography_subjects(bibliography_id, subject_id)` |
| Soft delete | YES |
| Separate CRUD | YES — `/api/subjects` with autocomplete |

### 7.7 `categories` — **RETAIN**

| Aspect | Decision |
|---|---|
| Decision | Keep `categories` alongside new `subjects`. They serve different purposes. |
| Reason | Categories are broad classification (e.g., "Teknologi", "Sosial"). Subjects are specific topics. |
| Migration | `collections.category_id` stays. `bibliography_subjects` is additive. |

### 7.8 Import Staging Tables — **CREATE**

| Table | Purpose |
|---|---|
| `import_batches` | Track upload sessions (filename, status, counts, user) |
| `import_rows` | Raw CSV rows with validation status, errors, resolved FKs |

---

## 8. Legacy Field Strategy

| Field | Current | Recommendation | Reason |
|---|---|---|---|
| `collections.isbn` | varchar(255), nullable | **Retain during compatibility period** — add `isbn_issn` column, backfill from `isbn`, deprecate `isbn` in later release |
| `collections.author` | varchar(255), nullable | **Retain during compatibility period** — keep as `sor` (statement of responsibility), populate `authors` table via import |
| `collections.publisher` | varchar(150), nullable | **Retain during compatibility period** — keep inline, add `publisher_id` FK, backfill from import |
| `collections.publicationYear` | varchar(100), nullable | **Retain during compatibility period** — add `publish_year` integer column, backfill |
| `collections.description` | text, nullable | **Rename to `notes`** in target — same semantic meaning |
| `collections.type` | enum, nullable | **Retain** — maps to `coll_type_name` on items |
| `collections.categoryId` | integer FK, nullable | **Retain** — coexists with subjects M:N |
| `collections.stock` | integer, NOT NULL, default 0 | **Retain as cache** — keep synced via stock service |
| `items.barcode` | varchar(50), UNIQUE | **Rename to `item_code`** — same semantic, Senayan-compatible name |
| `items.uniqueCode` | varchar(30), UNIQUE | **Retain during compatibility period** — map to `inventory_code` or deprecate |

### Deprecation Timeline

| Phase | Action |
|---|---|
| P1.2 | Add new columns alongside old ones (nullable) |
| P1.3 | Backfill new columns from old + import data |
| P1.6 | Old fields become read-only in API |
| P2.0 | Old fields removed from schema (after frontend migration) |

---

## 9. Bibliography API Gap

### 9.1 Current Endpoints → Target Mapping

| Current Endpoint | Keep/Replace | Proposed Endpoint | Auth | Roles | Changes |
|---|---|---|---|---|---|
| `GET /collections` | **REPLACE** | `GET /bibliographies` | Public | — | Add pagination, advanced filters, subject/GMD/language/call_number search |
| `GET /collections/:id` | **REPLACE** | `GET /bibliographies/:id` | Public | — | Include authors, subjects, item counts |
| `POST /collections` | **REPLACE** | `POST /bibliographies` | Yes | super_admin, staff | Accept all new fields, authors[], subjects[] |
| `PATCH /collections/:id` | **REPLACE** | `PATCH /bibliographies/:id` | Yes | super_admin, staff | Partial update with author/subject sync |
| `DELETE /collections/:id` | **REPLACE** | `DELETE /bibliographies/:id` | Yes | super_admin | Soft delete, reject if active loans |
| `POST /collections/import` | **REPLACE** | `POST /import/bibliographies` | Yes | super_admin, staff | Staged import with preview |
| `GET /collections/import/template` | **REPLACE** | `GET /import/bibliographies/template` | Yes | super_admin, staff | Senayan-compatible headers |
| — | **NEW** | `GET /bibliographies/search` | Public | — | Full-text search with facets |
| — | **NEW** | `GET /bibliographies/:id/items` | Public | — | List items under bibliography |
| — | **NEW** | `GET /publishers` | Public | — | Autocomplete lookup |
| — | **NEW** | `GET /authors` | Public | — | Autocomplete lookup |
| — | **NEW** | `GET /subjects` | Public | — | Autocomplete lookup |
| — | **NEW** | `GET /languages` | Public | — | Read-only lookup |
| — | **NEW** | `GET /gmds` | Public | — | Read-only lookup |
| — | **NEW** | `GET /places` | Public | — | Read-only lookup |
| — | **NEW** | `GET /export/bibliographies` | Yes | super_admin, staff | Senayan CSV export |

### 9.2 Target Bibliography Search Contract

```
GET /bibliographies?q=algoritma&subject=komputer&gmd=Text&language=id&year_from=2020&year_to=2024&has_available_items=true&page=1&limit=20&sort=title&order=asc

Response:
{
  success: true,
  data: {
    items: [
      {
        id, title, isbn_issn, edition, publish_year, call_number,
        image, classification, sor, collation, series_title, notes,
        publisher: { id, name },
        language: { id, code, name },
        gmd: { id, name },
        place: { id, name },
        authors: [{ id, name, role }],
        subjects: [{ id, name }],
        category: { id, name },
        totalItems: 5,
        availableItems: 3
      }
    ],
    total: 150,
    page: 1,
    limit: 20,
    totalPages: 8
  }
}
```

### 9.3 Target Bibliography Detail Contract

```
GET /bibliographies/:id

Response:
{
  success: true,
  data: {
    id, title, isbn_issn, edition, publish_year, call_number,
    image, classification, sor, collation, series_title, notes,
    description, type,
    publisher: { id, name },
    language: { id, code, name },
    gmd: { id, name },
    place: { id, name },
    authors: [{ id, name, role }],
    subjects: [{ id, name }],
    category: { id, name },
    totalItems: 5,
    availableItems: 3,
    items: [
      { id, item_code, inventory_code, status, location: { id, room, rack, shelf } }
    ],
    createdAt, updatedAt
  }
}
```

---

## 10. Item API Gap

### 10.1 Current Endpoints → Target Mapping

| Current Endpoint | Keep/Replace | Proposed Endpoint | Changes |
|---|---|---|---|
| `GET /items` | **REPLACE** | `GET /bibliographies/:bibId/items` | Nest under bibliography, add filters |
| `GET /items/:id` | **REPLACE** | `GET /items/:id` | Include all new fields, QR data |
| `POST /items` | **REPLACE** | `POST /bibliographies/:bibId/items` | Accept acquisition fields, auto-generate QR |
| `PATCH /items/:id` | **REPLACE** | `PATCH /items/:id` | Accept all new fields |
| `DELETE /items/:id` | **REPLACE** | `DELETE /items/:id` | Archive behavior, reject if loaned |
| — | **NEW** | `POST /bibliographies/:bibId/items/bulk` | Bulk creation |
| — | **NEW** | `PATCH /items/:id/status` | Status change with audit |
| — | **NEW** | `PATCH /items/:id/location` | Location move with audit |
| — | **NEW** | `GET /items/:id/qr` | Get QR image (SVG/PNG) |
| — | **NEW** | `POST /items/:id/qr/regenerate` | Regenerate QR token |
| — | **NEW** | `POST /items/:id/qr/revoke` | Revoke QR token |
| — | **NEW** | `GET /items/bulk-labels` | Bulk label data for printing |
| — | **NEW** | `GET /qr/resolve/:token` | Resolve QR to item+bibliography |
| — | **NEW** | `POST /import/items` | Staged item import |
| — | **NEW** | `GET /import/items/template` | Item import template |
| — | **NEW** | `GET /export/items` | Senayan item CSV export |

### 10.2 Target Item Create Contract

```
POST /bibliographies/:bibId/items

Body:
{
  item_code: "INV-001",
  inventory_code: "INV-2023-001",
  call_number: "005.1 ALG",
  location_id: 1,
  coll_type_name: "Text",
  vendor_id: 2,
  received_date: "2023-01-15",
  order_no: "PO-2023-001",
  order_date: "2023-01-10",
  source: "APBN 2023",
  invoice: "INV-2023-001",
  price: 150000,
  price_currency: "IDR",
  invoice_date: "2023-01-20",
  site: "Kampus Utama",
  status: "available"
}

Response:
{
  success: true,
  data: {
    id, item_code, inventory_code, status,
    qr_token, qr_generated_at,
    bibliography: { id, title },
    location: { id, room, rack, shelf },
    createdAt
  }
}
```

### 10.3 Bulk Item Create Contract

```
POST /bibliographies/:bibId/items/bulk

Body:
{
  items: [
    { item_code: "INV-001", location_id: 1 },
    { item_code: "INV-002", location_id: 1 },
    { item_code: "INV-003", location_id: 2 }
  ],
  defaults: {
    source: "APBN 2023",
    price_currency: "IDR"
  }
}

Response:
{
  success: true,
  data: {
    created: 3,
    items: [...]
  }
}
```

### 10.4 `collectionId` Immutability

**Current behavior:** `PATCH /items/:id` accepts `collectionId` in `updateItemSchema` — this allows moving an item to a different bibliography, which is **DANGEROUS** (breaks loan history integrity).

**Recommendation:** Remove `collectionId` from `updateItemSchema`. Item-to-bibliography assignment should be immutable after creation. If an item is mis-assigned, it should be archived and re-created.

---

## 11. QR Gap

### 11.1 Current QR Implementation (VERIFIED)

| Aspect | Current |
|---|---|
| Owner | `loans` table (verification_token) |
| Generation | `loan.service.ts:113-142` — `crypto.randomBytes(16).toString("hex")` |
| Expiry | 2 hours (`verificationExpiresAt`) |
| Payload | 32-char hex token (NOT a URL, NOT sensitive) |
| Storage | `loans.verification_token` column (indexed) |
| Display | `MyLoansPage.tsx:282-288` — `<img src={qrCodeUrl}>` (base64 data URL) |
| Scanning | `CirculationSection.tsx:262-326` — camera + image upload via `@yudiel/react-qr-scanner` + `jsqr` |
| Cleanup | Token nullified on approval (single-use) |
| Security | Safe — random hex, no sensitive data |

### 11.2 Target Item QR Design

| Aspect | Target |
|---|---|
| Owner | `items` table (qr_token, qr_version, qr_generated_at, qr_revoked_at) |
| Generation | On item creation — `crypto.randomBytes(20).toString("hex")` (40-char token) |
| Persistence | Permanent until revoked or regenerated |
| Payload | Opaque token only — resolves via `GET /api/qr/resolve/:token` |
| Storage | `items.qr_token` (UNIQUE, indexed), `items.qr_version` (integer), `items.qr_generated_at` (timestamp), `items.qr_revoked_at` (timestamp, nullable) |
| Image | Generated on-the-fly via `qrcode.toDataURL(token)` or `qrcode.toString(token, { type: 'svg' })` — NOT stored in DB |
| Display | `GET /api/items/:id/qr?format=svg|png` |
| Download | `GET /api/items/:id/qr/download?format=png` |
| Bulk print | `GET /api/items/bulk-labels?ids=id1,id2,id3` — returns label data |
| Resolve | `GET /api/qr/resolve/:token` — returns item + bibliography data |
| Revocation | `POST /api/items/:id/qr/revoke` — sets `qr_revoked_at` |
| Regeneration | `POST /api/items/:id/qr/regenerate` — new token, increment version |
| Checkout | Admin scans item QR → resolve → create loan (preserves existing loan QR flow) |
| Return | Admin scans item QR → resolve active loan → process return |
| Security | Token uniqueness enforced by DB UNIQUE constraint. Revoked tokens return 404. |

### 11.3 Loan QR Preservation

The existing loan verification QR (`loans.verification_token`) must NOT be removed during the transition. Both systems should coexist:
- **Item QR:** Persistent, used for circulation (checkout/return)
- **Loan QR:** Temporary (2h), used for loan approval verification

---

## 12. Import Architecture Gap

### 12.1 Current Import (VERIFIED)

| Aspect | Current |
|---|---|
| Endpoint | `POST /api/collections/import` |
| Parser | ExcelJS (handles CSV and XLSX) |
| Max size | 10MB (multer limit) |
| Memory | Entire file loaded into memory |
| Transaction | Single `db.transaction` wrapping ALL rows |
| Validation | Per-row Zod validation with `importCollectionRowSchema` |
| Duplicate detection | ISBN duplicate check (in-file + in-DB) |
| Relation resolution | `categoryId` validated against categories table |
| Stock behavior | Calls `syncItemsWithStock` per row (creates items inline) |
| Error reporting | Returns `{ insertedCount, totalRows, errors[] }` |
| Staging | **NONE** — direct commit |
| Preview | **NONE** — commit-or-fail |
| Progress | **NONE** — synchronous response |

### 12.2 Problems with Current Approach

1. **Memory:** Entire file loaded — will fail on large imports (thousands of rows)
2. **Transaction scope:** All-or-nothing — one bad row fails entire import
3. **No preview:** User cannot review before committing
4. **No staging:** No way to fix errors and retry
5. **No progress:** Synchronous — blocks HTTP connection
6. **Stock coupling:** Import creates items inline (wrong — items should be imported separately)
7. **No author/subject handling:** Flat string only

### 12.3 Target Staged Import Flow

```
1. Upload → POST /import/bibliographies/upload
   - Accepts CSV/XLSX (max 50MB)
   - Creates import_batch record
   - Streams file to disk (not memory)
   - Returns batch_id

2. Parse → POST /import/bibliographies/:batchId/parse
   - Reads file from disk in chunks
   - Inserts raw rows into import_rows table
   - Validates each row (Zod)
   - Resolves relations (publishers, authors, subjects, languages, gmds, places)
   - Marks rows as valid/invalid with error details
   - Returns progress

3. Preview → GET /import/bibliographies/:batchId/preview
   - Returns first N valid rows with resolved data
   - Returns error summary
   - Returns duplicate detection results

4. Approve → POST /import/bibliographies/:batchId/approve
   - Admin confirms import
   - Commits valid rows in transaction
   - Skips/updates duplicates based on strategy
   - Updates batch status to 'committed'
   - Returns final counts

5. Errors → GET /import/bibliographies/:batchId/errors
   - Downloads error report as CSV

6. History → GET /import/batches
   - Lists all import batches with status and counts
```

### 12.4 Streaming Consideration

For thousands of rows, use:
- `csv-parser` or `csv-parse` for streaming CSV parsing
- Chunked batch inserts (500 rows per INSERT)
- Progress tracking via `import_batches.processed_rows`

**Note:** Bull/BullMQ and Redis are NOT installed. Background job processing requires adding these dependencies. Alternatively, use a synchronous approach with chunked processing and progress polling.

---

## 13. Export Architecture Gap

### 13.1 Current Export (VERIFIED)

| Endpoint | Format | Headers |
|---|---|---|
| `GET /reports/loans/export` | CSV, PDF | `Nama Peminjam, Email, Judul Buku, ISBN, Status, Tgl Pinjam, Tgl Jatuh Tempo, Tgl Kembali` |
| `GET /reports/fines/export` | CSV, PDF | `Nama Member, Email, Judul Buku, Jumlah Denda, Status Denda, Tgl Denda Dibuat, Tgl Pembayaran` |

**CSV implementation:** BOM + comma delimiter + double-quote all values + `""` escaping.

### 13.2 Target Bibliography Export

```
GET /export/bibliographies?format=csv

Headers (exact order):
title;gmd_name;edition;isbn_issn;publisher_name;publish_year;collation;series_title;call_number;language_name;place_name;classification;notes;image;sor;authors;topics;item_code

Delimiter: semicolon (;)
Encoding: UTF-8 with BOM
Quoting: Fields containing semicolons or newlines wrapped in double quotes
Date format: YYYY-MM-DD
Empty value: empty string (not null)
Multi-value authors: semicolon-delimited "Ahmad Fauzi;Budi Santoso"
Multi-value topics: semicolon-delimited "Algoritma;Pemrograman"
Multi-value item_code: semicolon-delimited "INV-001;INV-002"
Row ordering: title ASC, then isbn_issn ASC
```

### 13.3 Target Item Export

```
GET /export/items?format=csv

Headers (exact order):
item_code;call_number;coll_type_name;inventory_code;received_date;supplier_name;order_no;location_name;order_date;item_status_name;site;source;invoice;price;price_currency;invoice_date;input_date;last_update;title

Delimiter: semicolon (;)
Encoding: UTF-8 with BOM
Price format: decimal with 2 places (150000.00)
Date format: YYYY-MM-DD
Location format: "room, rack, shelf" concatenated
```

### 13.4 Golden-File Tests

Create test fixtures:
- `test/fixtures/bibliography_export_expected.csv` — exact expected output for known input
- `test/fixtures/item_export_expected.csv` — exact expected output for known input
- Test: import CSV → export CSV → compare with expected (round-trip)

---

## 14. Stock and Concurrency Gap

### 14.1 Operations That Change Availability

| Operation | Stock Sync | Transaction | Status |
|---|---|---|---|
| Create item | YES (P0 fixed) | YES | VERIFIED |
| Bulk create items | **MISSING** | — | Need batch stock sync |
| Update item status | YES (P0 fixed) | YES | VERIFIED |
| Archive/delete item | YES (P0 fixed) | YES | VERIFIED |
| Loan approval | YES | YES | VERIFIED |
| Loan rejection | YES | YES | VERIFIED |
| Return approval | YES | YES | VERIFIED |
| Import items | **MISSING** | — | Import doesn't create items separately |

### 14.2 Stock Service Design

The `syncCollectionAvailableStock` function (P0 repair) is the single source of truth. All stock-changing operations must:
1. Be inside a `db.transaction`
2. Call `syncCollectionAvailableStock(tx, collectionId/bibliographyId)` at the end
3. Use the same transaction object

### 14.3 Concurrency Risk

- **Current:** PostgreSQL default isolation (READ COMMITTED) is sufficient for the `SELECT count(*) + UPDATE` pattern within a transaction
- **Risk:** Two concurrent item creates could both read the same count, but since they're in separate transactions, PostgreSQL will serialize the UPDATE (one will wait for the other's COMMIT)
- **Mitigation:** The transaction boundary is correct. No explicit row locking needed for this pattern.

---

## 15. Authentication, RBAC, and Audit Gap

### 15.1 Auth (VERIFIED)

| Aspect | Current |
|---|---|
| Mechanism | Better Auth (cookie-based, `credentials: "include"`) |
| Roles | `student`, `lecturer`, `staff`, `super_admin`, `external` (member_type) |
| RBAC | `requireRole(["super_admin","staff"])` middleware |
| Permission model | Role-based, not permission-based |

### 15.2 RBAC Gap

| Action | Current Required Role | Target Required Role |
|---|---|---|
| Create bibliography | super_admin, staff | super_admin, staff (UNCHANGED) |
| Delete bibliography | super_admin, staff | super_admin only (TIGHTEN) |
| Import bibliographies | super_admin, staff | super_admin only (TIGHTEN) |
| Export bibliographies | — | super_admin, staff (NEW) |
| Create item | super_admin, staff | super_admin, staff (UNCHANGED) |
| Bulk create items | — | super_admin, staff (NEW) |
| Generate/revoke QR | — | super_admin, staff (NEW) |
| Import items | — | super_admin only (NEW) |

### 15.3 Audit Gap

**Current:** `auditService.createLog()` exists but is NOT used in collection, item, loan, reservation, or fines modules.

**Target:** All CRUD operations on bibliographies, items, and QR should log to `logs` table with:
- `action`: create, update, delete
- `entity`: collection, item
- `entityId`: affected record ID
- `userId`: actor
- `ipAddress`: request IP
- `detail`: JSON summary of changes

---

## 16. Clean Development Reset Assessment

### 16.1 Current State

| Factor | Assessment |
|---|---|
| Production data | NO — this is a development database |
| Data source | Senayan CSV export (authoritative) |
| Current data volume | 27 collections, 27,632 items, 48 loans |
| Migration history | BROKEN — non-reproducible from git |
| Schema drift | MINOR — 4 objects created via push |

### 16.2 Recommendation: **CLEAN RESET IS LOWEST-RISK APPROACH**

**Justification:**
1. Development database — no production data to lose
2. Authoritative data will be re-imported from Senayan CSVs
3. Migration history is already broken — fixing it is more complex than starting fresh
4. Schema changes are extensive — easier to create clean baseline than incremental migrations

### 16.3 Safe Reset Procedure

1. **Git tag** current state: `git tag pre-p1-baseline`
2. **Database dump:** `pg_dump -Fc DATABASE_URL > backup_pre_reset.dump`
3. **Row-count snapshot** of all 22 tables
4. **Archive** old migration files: `mv drizzle/ drizzle_archive/`
5. **Finalize** `schema.ts` with all target tables and columns
6. **Generate** clean baseline: `npx drizzle-kit generate --name baseline`
7. **Review** generated SQL — verify all objects
8. **Create** new empty dev database
9. **Migrate** from zero: `npx drizzle-kit migrate`
10. **Seed** essentials: users, categories, locations, languages, GMDs
11. **Dry-run** bibliography import from Senayan CSV
12. **Dry-run** item import from Senayan CSV
13. **Export** and compare with source CSVs (round-trip verification)

---

## 17. Backward Compatibility Matrix

| Consumer | Affected By | Strategy |
|---|---|---|
| Frontend collection pages | Bibliography rename, new fields | **Breaking later** — maintain `/api/collections` alias during transition |
| Frontend item pages | New item fields, QR | **Additive** — new fields are optional |
| Loan services | Bibliography reference | **Additive** — loans reference items, not bibliographies directly |
| Reservations | Bibliography reference | **Additive** — reservations reference collections/bibliographies |
| Reports | New export endpoints | **Additive** — existing reports unchanged |
| Dashboards | Stats queries | **Additive** — new stats added |
| Recommendations | Bibliography search | **Additive** — search enhanced |
| Collection views | Analytics table | **Unchanged** |
| Collection contents | Digital content | **Unchanged** |
| Swagger | All endpoints | **Breaking later** — update docs with new endpoints |
| Tests | All modules | **Additive** — new tests for new features |
| Seed data | Categories, locations | **Additive** — new seed data for languages, GMDs, etc. |

### Compatibility Period

| Old Endpoint | New Endpoint | Duration |
|---|---|---|
| `GET /api/collections` | `GET /api/bibliographies` | 4 weeks — then redirect |
| `GET /api/collections/:id` | `GET /api/bibliographies/:id` | 4 weeks |
| `POST /api/collections` | `POST /api/bibliographies` | 4 weeks |
| `GET /api/items` | `GET /api/bibliographies/:id/items` | 4 weeks |

---

## 18. Test Gap Matrix

| Area | Current Coverage | Required Tests |
|---|---|---|
| Bibliography CRUD | 0 controller/service tests | Create, read, update, soft delete, search, pagination |
| Authors M:N | 0 | Create author, attach to bibliography, detach, autocomplete |
| Subjects M:N | 0 | Create subject, attach to bibliography, detach, autocomplete |
| Item single creation | 11 tests (P0 added) | Add: new fields, QR generation, inventory_code uniqueness |
| Item bulk creation | 0 | Bulk create, partial failure, stock sync |
| Duplicate item_code | 0 | Reject duplicate, case sensitivity |
| Duplicate inventory_code | 0 | Reject duplicate |
| QR generation | 0 | Generate on create, token uniqueness |
| QR resolution | 0 | Resolve valid token, revoked token, expired token |
| QR regeneration | 0 | New token, version increment |
| QR revocation | 0 | Set revoked_at, resolve returns 404 |
| Import validation | 0 | Valid rows, invalid rows, missing relations |
| Import duplicate rows | 0 | In-file duplicates, DB duplicates |
| Import missing bibliography | 0 | Item import with non-existent bibliography |
| Import error download | 0 | Error CSV generation |
| Import approval commit | 0 | Transactional commit, row count verification |
| Export exact headers | 0 | Bibliography CSV headers match spec exactly |
| Export exact ordering | 0 | Deterministic row ordering |
| Import-export round trip | 0 | Import CSV → export CSV → compare |
| Stock reconciliation | 0 | After import, stock matches item count |
| Concurrent operations | 0 | Concurrent item create/delete |
| RBAC | 0 | Role-based access for all new endpoints |
| Audit logs | 0 | All CRUD operations logged |

---

## 19. File-by-File Change Matrix

### Schema and Database

| File | Current Responsibility | Action | Change |
|---|---|---|---|
| `src/db/schema.ts` | All table definitions | **MODIFY** | Add 8 new tables, expand collections/items, add relations |
| `drizzle/` | Migration files | **CREATE** | New baseline migration + incremental migrations |
| `drizzle.config.ts` | Drizzle config | **KEEP** | Unchanged |
| `src/db/seed.ts` | Seed data | **MODIFY** | Add languages, GMDs, places seed data |

### Bibliography Module (rename from collection)

| File | Action | Change |
|---|---|---|
| `src/modules/collection/route/collection.route.ts` | **RENAME+MODIFY** | → `bibliography/`, add new endpoints |
| `src/modules/collection/controller/collection.controller.ts` | **RENAME+MODIFY** | → `bibliography/`, add search, pagination, export |
| `src/modules/collection/service/collection.service.ts` | **RENAME+MODIFY** | → `bibliography/`, expand fields, author/subject M:N |
| `src/modules/collection/validation/collection.validation.ts` | **RENAME+MODIFY** | → `bibliography/`, add all new fields |
| `src/modules/collection/__tests__/collection.validation.test.ts` | **RENAME+MODIFY** | → `bibliography/`, expand tests |

### New Modules

| File | Action | Purpose |
|---|---|---|
| `src/modules/author/` (NEW) | **CREATE** | Author CRUD + autocomplete |
| `src/modules/subject/` (NEW) | **CREATE** | Subject CRUD + autocomplete |
| `src/modules/publisher/` (NEW) | **CREATE** | Publisher CRUD + autocomplete |
| `src/modules/qr/` (NEW) | **CREATE** | QR generation, resolution, revocation |
| `src/modules/import/` (NEW) | **CREATE** | Staged import (bibliography + item) |
| `src/modules/export/` (NEW) | **CREATE** | Senayan-compatible export |

### Item Module

| File | Action | Change |
|---|---|---|
| `src/modules/item/service/item.service.ts` | **MODIFY** | Add new fields, QR generation, bulk create |
| `src/modules/item/validation/item.validation.ts` | **MODIFY** | Add all new fields, remove collectionId from update |
| `src/modules/item/route/item.route.ts` | **MODIFY** | Add bulk create, QR endpoints, status/location change |
| `src/modules/item/controller/item.controller.ts` | **MODIFY** | Add new handlers |
| `src/modules/item/__tests__/item.service.test.ts` | **MODIFY** | Expand for new fields and QR |

### Shared

| File | Action | Change |
|---|---|---|
| `src/modules/shared/utils/stock-sync.ts` | **KEEP** | Already correct |
| `src/modules/shared/utils/emailTemplate.ts` | **KEEP** | Unchanged |
| `src/routes/index.ts` | **MODIFY** | Add new module routes |

### Reports

| File | Action | Change |
|---|---|---|
| `src/modules/report/service/report.service.ts` | **MODIFY** | Add bibliography + item export functions |
| `src/modules/report/controller/report.controller.ts` | **MODIFY** | Add export endpoints |
| `src/modules/report/route/report.route.ts` | **MODIFY** | Add export routes |

### Swagger

| File | Action | Change |
|---|---|---|
| `src/config/swagger.ts` | **MODIFY** | Add schemas for all new entities and endpoints |

---

## 20. Proposed Target ERD

(See Section 4 for detailed ERD)

**Summary of new tables:** 8 (publishers, languages, places, gmds, authors, bibliography_authors, subjects, bibliography_subjects)
**Summary of new staging tables:** 2 (import_batches, import_rows)
**Summary of modified tables:** 2 (collections→bibliographies, items)
**Summary of new columns on items:** 14
**Summary of new columns on collections/bibliographies:** 9

---

## 21. Proposed API Contract Matrix

| Method | Endpoint | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/bibliographies` | Public | — | Search/list bibliographies with pagination |
| GET | `/bibliographies/:id` | Public | — | Bibliography detail with authors, subjects, items |
| POST | `/bibliographies` | Yes | super_admin, staff | Create bibliography |
| PATCH | `/bibliographies/:id` | Yes | super_admin, staff | Update bibliography |
| DELETE | `/bibliographies/:id` | Yes | super_admin | Soft delete bibliography |
| GET | `/bibliographies/:id/items` | Public | — | List items under bibliography |
| POST | `/bibliographies/:id/items` | Yes | super_admin, staff | Create single item |
| POST | `/bibliographies/:id/items/bulk` | Yes | super_admin, staff | Bulk create items |
| GET | `/items/:id` | Public | — | Item detail |
| PATCH | `/items/:id` | Yes | super_admin, staff | Update item |
| DELETE | `/items/:id` | Yes | super_admin, staff | Archive item |
| PATCH | `/items/:id/status` | Yes | super_admin, staff | Change item status |
| PATCH | `/items/:id/location` | Yes | super_admin, staff | Move item location |
| GET | `/items/:id/qr` | Yes | super_admin, staff | Get QR image |
| POST | `/items/:id/qr/regenerate` | Yes | super_admin | Regenerate QR |
| POST | `/items/:id/qr/revoke` | Yes | super_admin | Revoke QR |
| GET | `/items/bulk-labels` | Yes | super_admin, staff | Bulk label data |
| GET | `/qr/resolve/:token` | Yes | super_admin, staff | Resolve QR to item |
| GET | `/authors` | Public | — | Author autocomplete |
| GET | `/subjects` | Public | — | Subject autocomplete |
| GET | `/publishers` | Public | — | Publisher autocomplete |
| GET | `/languages` | Public | — | Language lookup |
| GET | `/gmds` | Public | — | GMD lookup |
| GET | `/places` | Public | — | Place lookup |
| POST | `/import/bibliographies/upload` | Yes | super_admin | Upload bibliography CSV |
| POST | `/import/bibliographies/:id/parse` | Yes | super_admin | Parse and validate |
| GET | `/import/bibliographies/:id/preview` | Yes | super_admin | Preview results |
| POST | `/import/bibliographies/:id/approve` | Yes | super_admin | Commit import |
| GET | `/import/bibliographies/:id/errors` | Yes | super_admin | Download error report |
| POST | `/import/items/upload` | Yes | super_admin | Upload item CSV |
| POST | `/import/items/:id/parse` | Yes | super_admin | Parse and validate |
| GET | `/import/items/:id/preview` | Yes | super_admin | Preview results |
| POST | `/import/items/:id/approve` | Yes | super_admin | Commit import |
| GET | `/import/items/:id/errors` | Yes | super_admin | Download error report |
| GET | `/import/batches` | Yes | super_admin | Import history |
| GET | `/export/bibliographies` | Yes | super_admin, staff | Senayan bibliography CSV |
| GET | `/export/items` | Yes | super_admin, staff | Senayan item CSV |

---

## 22. Implementation Phases

### P1.1 — Clean Schema and Baseline

**Scope:** Reset database, finalize schema.ts with all target tables, generate clean baseline migration.

**Files:** `schema.ts`, `drizzle/`, `seed.ts`
**Migration:** Single baseline migration
**Endpoints:** None (schema only)
**Tests:** Migration applies cleanly, seed works
**Acceptance:** `drizzle-kit migrate` succeeds on empty DB, all tables created

### P1.2 — Bibliography Metadata and Masters

**Scope:** Create publishers, languages, places, GMDs, authors, subjects modules. Create bibliography CRUD with all new fields and M:N relations.

**Files:** New modules (author, subject, publisher), modified collection→bibliography module
**Migration:** Included in baseline
**Endpoints:** `GET/POST/PATCH/DELETE /bibliographies`, lookup endpoints
**Tests:** Bibliography CRUD, author/subject M:N, lookup endpoints
**Acceptance:** Can create bibliography with authors and subjects via API

### P1.3 — Item Fields and Item CRUD

**Scope:** Expand items with all acquisition fields, QR fields, item_code/inventory_code. Implement single and bulk creation.

**Files:** Modified item module
**Migration:** Included in baseline
**Endpoints:** `POST/PATCH/DELETE /items`, `POST /items/bulk`, status/location change
**Tests:** Item CRUD with new fields, bulk create, duplicate detection
**Acceptance:** Can create items with all fields, stock stays consistent

### P1.4 — Persistent Item QR

**Scope:** Generate QR on item creation, resolve/scan, revoke, regenerate, bulk labels.

**Files:** New `qr` module, modified item module
**Migration:** Included in baseline
**Endpoints:** `GET /items/:id/qr`, `GET /qr/resolve/:token`, regenerate, revoke, bulk labels
**Tests:** QR generation, resolution, revocation, regeneration
**Acceptance:** Every item has a persistent QR, can be scanned for checkout/return

### P1.5 — Staging Import

**Scope:** Bibliography and item import with staging, validation, preview, approval.

**Files:** New `import` module, new staging tables
**Migration:** Included in baseline
**Endpoints:** Upload, parse, preview, approve, error download, history
**Tests:** Valid/invalid rows, duplicates, missing relations, approval commit
**Acceptance:** Can import 1000+ row CSV with preview and error handling

### P1.6 — Senayan Export

**Scope:** Bibliography and item export in Senayan-compatible CSV format.

**Files:** Modified report module, new export functions
**Migration:** None
**Endpoints:** `GET /export/bibliographies`, `GET /export/items`
**Tests:** Exact headers, exact ordering, round-trip import/export
**Acceptance:** Export matches Senayan format exactly, round-trip preserves data

### P1.7 — Circulation Integration

**Scope:** Use item QR for checkout/return while preserving existing loan QR.

**Files:** Modified loan module
**Migration:** None
**Endpoints:** `GET /qr/resolve/:token` integration with loan flow
**Tests:** Checkout via item QR, return via item QR, loan QR still works
**Acceptance:** Both QR systems coexist, no breaking changes to loan flow

### P1.8 — Frontend Contract Handoff

**Scope:** Document all API contracts for frontend team, update Swagger, create API examples.

**Files:** `swagger.ts`, API documentation
**Migration:** None
**Endpoints:** All new endpoints documented
**Tests:** Swagger validates against actual responses
**Acceptance:** Frontend team can integrate all endpoints from Swagger docs

---

## 23. Risks and Rollback Boundaries

| Risk | Severity | Mitigation |
|---|---|---|
| Data loss during reset | HIGH | pg_dump backup + row-count verification |
| Import breaks on large files | MEDIUM | Streaming parser + chunked inserts |
| QR token collision | LOW | 40-char hex = 160 bits, collision probability negligible |
| Stock inconsistency after import | MEDIUM | Transaction-wrapped import with stock sync |
| Breaking frontend during rename | MEDIUM | Compatibility aliases for 4 weeks |
| Author name parsing errors | MEDIUM | Preserve original `sor` field as fallback |
| Subject/topic mapping errors | MEDIUM | Import staging with preview |

### Phase Rollback Boundaries

| Phase | Rollback |
|---|---|
| P1.1 | Restore from pg_dump |
| P1.2 | Drop new tables, restore old schema |
| P1.3 | Drop new columns (nullable, no data loss) |
| P1.4 | Drop QR columns (nullable, no data loss) |
| P1.5 | Drop staging tables, keep main tables |
| P1.6 | Remove export endpoints (additive only) |
| P1.7 | Revert loan module changes |
| P1.8 | Documentation only — no rollback needed |

---

## 24. Business Decisions Still Required

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | Keep `collections` name or rename to `bibliographies`? | Rename vs keep | Rename with compatibility alias |
| 2 | Categories vs subjects? | 1:1 migration vs coexist | Coexist — different taxonomies |
| 3 | Publisher normalization? | Inline vs separate table | Separate table |
| 4 | Author string parsing strategy? | Manual vs automated | Semi-automated with `;` delimiter + manual review |
| 5 | Item QR on creation or on demand? | Auto vs manual trigger | Auto-generate on creation |
| 6 | SLiMS `item_code` maps to? | barcode vs uniqueCode vs new field | Rename `barcode` → `item_code` |
| 7 | Per-item `call_number` or per-bibliography? | Item-level vs biblio-level | Both (biblio default, item override) |
| 8 | `stock` column keep or remove? | Cache vs compute on-demand | Keep as cache |
| 9 | Reservation level? | Bibliography vs item | Keep bibliography-level |
| 10 | Fine rate configurable? | Hardcoded Rp500 vs DB setting | Configurable (add `settings` table) |
| 11 | Import staging tables? | Direct vs staging+review | Staging (approved) |
| 12 | `external` member type? | Keep vs remove | Keep (auth fallback) |
| 13 | Background job processing? | Sync vs Bull/BullMQ | Sync with chunked processing (avoid Redis dependency) |
| 14 | Clean dev database reset? | Reset vs incremental | Reset (approved in Section 16) |
| 15 | `uniqueCode` → `inventory_code`? | Rename vs new column | Rename (same semantic) |

---

## 25. Final Recommendation

### Immediate Actions (Before P1.1)

1. **Un-ignore `drizzle/meta`** in `.gitignore` — make migration history reproducible
2. **Apply migrations 0010 and 0011** to dev database (already verified safe)
3. **Create baseline migration 0012** for push-created objects (`return_requests`, `external` enum, `members.origin_region/institution`)
4. **Decision needed:** Confirm clean dev database reset (Section 16)

### P1 Sequence (Recommended)

1. **P1.1** — Clean schema + baseline (1 week)
2. **P1.2** — Bibliography + masters (2 weeks)
3. **P1.3** — Item fields + CRUD (1 week)
4. **P1.4** — Item QR (1 week)
5. **P1.5** — Staging import (2 weeks)
6. **P1.6** — Senayan export (1 week)
7. **P1.7** — Circulation integration (1 week)
8. **P1.8** — Frontend contract handoff (1 week)

**Total estimated:** 10 weeks for complete P1 implementation.

### Critical Path

1. Schema.ts changes (blocks everything)
2. Author/Subject junction tables (blocks bibliography form)
3. Item QR fields (blocks circulation refactor)
4. Import staging tables (blocks import feature)

---

## Appendix A: Files Inspected

### Backend
- `library-be/package.json`
- `library-be/drizzle.config.ts`
- `library-be/vitest.config.ts`
- `library-be/.gitignore`
- `library-be/src/index.ts`
- `library-be/src/db/schema.ts` (555 lines, complete)
- `library-be/src/db/index.ts`
- `library-be/src/db/seed.ts`
- `library-be/src/routes/index.ts`
- `library-be/src/lib/auth.ts`
- `library-be/src/config/mailer.ts`
- `library-be/src/config/swagger.ts`
- `library-be/src/middlewares/auth.middleware.ts`
- `library-be/src/middlewares/error.middleware.ts`
- `library-be/src/middlewares/rateLimiter.ts`
- `library-be/src/exceptions/AppError.ts`
- `library-be/src/utils/auth-types.ts`
- `library-be/src/utils/upload.ts`
- All 14 module directories (routes, controllers, services, validations, tests)
- `library-be/drizzle/0000_real_captain_britain.sql` through `0011_missing_indexes.sql`
- `library-be/drizzle/meta/_journal.json`
- All 4 prior audit reports

### External
- `C:\MUCILIB - PERPUS\SRS - Sistem Perpustakaan.docx`

### NOT Found in Repository
- `senayan_biblio_export (2).csv` — NOT FOUND
- `senayan_item_export_kloter 5.csv` — NOT FOUND
- `MUCILIB_Audit_Biblio_Item_dan_Mapping_Schema.xlsx` — NOT FOUND

---

## Appendix B: Commands Executed

```bash
# Baseline
npm ci
npx tsc --noEmit
npx vitest run
npm run build

# Database inspection (read-only)
node _db_introspect.js
node _migration_check.js

# Git
git status --short
git diff --stat
git log --oneline -10
```

---

## Appendix C: Test and Build Results

| Check | Result |
|---|---|
| `npx tsc --noEmit` (backend) | PASS (0 errors) |
| `npx vitest run` (backend) | **111 passed, 0 failed** |
| `npm run build` (backend) | PASS |
| `npx tsc --noEmit` (frontend) | PASS (0 errors) |
| `npm run build` (frontend) | PASS |

---

## Appendix D: Exact Export Headers

### Bibliography Export (semicolon-delimited)
```
title;gmd_name;edition;isbn_issn;publisher_name;publish_year;collation;series_title;call_number;language_name;place_name;classification;notes;image;sor;authors;topics;item_code
```

### Item Export (semicolon-delimited)
```
item_code;call_number;coll_type_name;inventory_code;received_date;supplier_name;order_no;location_name;order_date;item_status_name;site;source;invoice;price;price_currency;invoice_date;input_date;last_update;title
```

---

## Appendix E: Existing Route Inventory

| Module | Endpoints | Count |
|---|---|---|
| Auth | POST /campus/verify, GET/PATCH /users/*, POST /users/:id/sync-member | 5 |
| Category | CRUD /categories | 5 |
| Collection | CRUD /collections, import template, import | 7 |
| Item | CRUD /items | 5 |
| Loan | request, verify, approve, reject, return-request, approve-return, pending-returns, list, history, extend | 10 |
| Location | CRUD /locations | 5 |
| Member | profile, card management | 8 |
| Reservation | create, my, cancel, all | 4 |
| Fines | CRUD, pay, audit | 7 |
| Notification | send-fines, send-loans | 2 |
| Recommendation | CRUD, history | 5 |
| Audit | GET /logs | 1 |
| Report | dashboard, popular-books, guest-stats, export-loans, export-fines, fines-revenue, web-traffic, track | 8 |
| Guest | CRUD, campus search, stats, absensi | 9 |
| **Total** | | **~81** |

---

## Appendix F: Proposed Route Inventory

(See Section 21 for complete matrix — **~36 new endpoints** added)

---

## Appendix G: Explicit Confirmation

**No code, schema, migration, or database was modified during this audit.** All findings are based on read-only inspection of the repository and live database. The only files created are this audit report and the temporary inspection scripts (since deleted).
