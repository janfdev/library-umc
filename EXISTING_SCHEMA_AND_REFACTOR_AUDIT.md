# EXISTING SCHEMA AND REFACTOR AUDIT — MUCILIB

> **Audit Date:** 2026-06-18
> **Auditor Role:** Senior Software Architect / PostgreSQL DB Architect / Express Backend Engineer / React Frontend Engineer / Security Reviewer
> **Objective:** Produce verified source-of-truth audit for safe refactor from Collection+Item → Bibliography+Item/Copy model

---

## 1. Executive Summary

MUCILIB is a university library management system built with Express 5 + TypeScript + Drizzle ORM (PostgreSQL) on the backend and React 19 + Vite + Tailwind + shadcn/ui on the frontend. The system manages 22 database tables across 12 enums, with 14 backend modules exposing ~60 API endpoints.

**Key Findings:**

- The current `collections` table acts as a flat catalog record (title+stock) — it does NOT match the target Bibliography model (missing edition, language, call number, classification, subjects, collation, series title, place of publication, statement of responsibility).
- The `items` table represents physical copies but lacks acquisition metadata (supplier, price, invoice, inventory code, received date) required by the target model.
- QR codes currently exist ONLY for loan verification tokens — there are NO QR codes for individual items.
- Stock is a denormalized cache on `collections.stock`, auto-synced by counting `items WHERE status='available' AND deletedAt IS NULL`.
- The `returnRequests` table is defined in schema.ts but has NO migration — it does not exist in the database.
- The `external` member type enum value was never added via migration.
- No SLiMS/Senayan export CSV files, SRS document, or mapping Excel exist in the repository.
- 8 of 13 backend modules have only validation tests — no controller or service tests.
- No React Query — all frontend data fetching uses raw useState/useEffect with manual loading/error state.

---

## 2. Repository and Technology Verification

### 2.1 Backend Stack (VERIFIED from package.json)

| Dependency | Version | File | Status |
|---|---|---|---|
| express | ^5.2.1 | library-be/package.json:33 | VERIFIED — Express 5 |
| typescript | ^5.9.3 | library-be/package.json:45 | VERIFIED |
| drizzle-orm | ^0.45.1 | library-be/package.json:30 | VERIFIED |
| pg | ^8.17.2 | library-be/package.json:38 | VERIFIED — node-postgres |
| better-auth | ^1.5.5 | library-be/package.json:26 | VERIFIED |
| zod | ^4.3.5 | library-be/package.json:46 | VERIFIED |
| qrcode | ^1.5.4 | library-be/package.json:39 | VERIFIED |
| multer | ^2.1.1 | library-be/package.json:35 | VERIFIED |
| cloudinary | ^2.9.0 | library-be/package.json:27 | VERIFIED |
| pdfkit | ^0.17.2 | library-be/package.json:37 | VERIFIED |
| exceljs | ^4.4.0 | library-be/package.json:32 | VERIFIED |
| vitest | ^4.1.0 | library-be/package.json:58 | VERIFIED |
| supertest | ^7.2.2 | library-be/package.json:55 | VERIFIED |
| drizzle-kit | ^0.31.8 | library-be/package.json:53 | VERIFIED |
| resend | ^6.12.0 | library-be/package.json:40 | VERIFIED |
| swagger-jsdoc | ^6.2.8 | library-be/package.json:42 | VERIFIED |

### 2.2 Frontend Stack (VERIFIED from package.json)

| Dependency | Version | File | Status |
|---|---|---|---|
| react | ^19.2.5 | library-fe/package.json:34 | VERIFIED — React 19 |
| react-dom | ^19.2.5 | library-fe/package.json:35 | VERIFIED |
| react-router | ^7.12.0 | library-fe/package.json:36 | VERIFIED |
| vite | ^7.3.2 | library-fe/package.json:61 | VERIFIED |
| tailwindcss | ^4.1.18 | library-fe/package.json:40 | VERIFIED — Tailwind v4 |
| typescript | ^5.9.3 | library-fe/package.json:59 | VERIFIED |
| zod | ^4.3.6 | library-fe/package.json:42 | VERIFIED |
| recharts | ^3.8.0 | library-fe/package.json:37 | VERIFIED |
| @tanstack/react-table | ^8.21.3 | library-fe/package.json:23 | VERIFIED |
| @yudiel/react-qr-scanner | ^2.5.1 | library-fe/package.json:24 | VERIFIED |
| jsqr | ^1.4.0 | library-fe/package.json:30 | VERIFIED |
| lucide-react | ^0.562.0 | library-fe/package.json:31 | VERIFIED |
| framer-motion | ^12.27.1 | library-fe/package.json:29 | VERIFIED |
| vitest | ^4.1.8 | library-fe/package.json:62 | VERIFIED |

### 2.3 React Query / TanStack Query

**Status: NOT FOUND** — Neither `@tanstack/react-query` nor `react-query` appears in any package.json or import statement. All data fetching uses raw `useState`/`useEffect` patterns. VERIFIED by scanning all hooks in `library-fe/src/hooks/`.

### 2.4 Drizzle Config

**File:** `library-be/drizzle.config.ts`
- Schema source: `./src/db/schema.ts` (single file)
- Dialect: `postgresql`
- Output: `./drizzle/`
- DB credentials from `DATABASE_URL` env var

### 2.5 External Files Status

| File | Status |
|---|---|
| senayan_biblio_export CSV | NOT FOUND in repository |
| senayan_item_export CSV | NOT FOUND in repository |
| MUCILIB_Audit_Biblio_Item_dan_Mapping_Schema.xlsx | NOT FOUND in repository |
| SRS - Sistem Perpustakaan.docx | NOT FOUND in repository |
| .env files | NOT SCANNED per user instruction |

---

## 3. Existing Database Schema Inventory

### 3.1 Enums (12 total) — VERIFIED from schema.ts:20-86 and migrations

| # | Enum (TS) | Enum (SQL) | Values | Line |
|---|---|---|---|---|
| 1 | `collectionTypeEnum` | `collection_type` | `physical_book`, `ebook`, `journal`, `thesis` | :20-25 |
| 2 | `contentTypeEnum` | `content_type` | `text`, `pdf`, `url` | :26 |
| 3 | `itemStatusEnum` | `item_status` | `available`, `loaned`, `damaged`, `lost` | :27-32 |
| 4 | `loansStatusEnum` | `loans_status` | `pending`, `approved`, `returned`, `extended`, `rejected` | :33-39 |
| 5 | `reservationsStatusEnum` | `reservations_status` | `waiting`, `fulfilled`, `canceled` | :40-44 |
| 6 | `finesStatusEnum` | `fines_status` | `paid`, `unpaid` | :45 |
| 7 | `logsStatusEnum` | `logs_status` | `create`, `update`, `delete`, `approve`, `blacklist`, `failed_login`, `rate_limited` | :46-54 |
| 8 | `logsEntityEnum` | `logs_entity` | `loan`, `item`, `fine`, `Users`, `category`, `collection`, `reservation`, `auth` | :55-64 |
| 9 | `recommendationStatusEnum` | `recommendation_status` | `pending`, `approved`, `rejected` | :66-70 |
| 10 | `memberType` | `member_type` | `student`, `lecturer`, `staff`, `super_admin`, `external` | :72-78 |
| 11 | `memberCardStatusEnum` | `member_card_status` | `not_requested`, `pending`, `active`, `rejected`, `expired` | :80-86 |
| 12 | `returnRequestStatusEnum` | `return_request_status` | `pending`, `approved` | :359-362 |

**CONFLICTING:** `member_type` in schema.ts includes `"external"` (line 77) but migration `0000_real_captain_britain.sql:8` created only `('student', 'lecturer', 'staff', 'admin')`. The `"external"` value was never added via `ALTER TYPE`. Later migration `0001_breezy_gamora.sql` changed `'admin'` to `'super_admin'` but never added `'external'`.

**CONFLICTING:** `logs_entity` enum has `"Users"` with capital U (line 59) — inconsistent casing vs all other lowercase values. This was present from the initial migration.

**CONFLICTING:** `loans_status` in initial migration was `('pending', 'approved', 'returned', 'extended')` — the `"rejected"` value was added in a later migration.

### 3.2 Tables (22 total) — Complete Inventory

#### 3.2.1 `categories` — VERIFIED schema.ts:92-97

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `integer` | NOT NULL | generated always as identity | PK |
| `name` | `name` | `varchar(100)` | NOT NULL | — | — |
| `description` | `description` | `text` | NULL | — | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Indexes: none
- Unique constraints: none
- References FROM: `collections.categoryId`
- Business purpose: Library item category master data

#### 3.2.2 `locations` — VERIFIED schema.ts:99-105

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `integer` | NOT NULL | generated always as identity | PK |
| `room` | `room` | `varchar(200)` | NOT NULL | — | — |
| `rack` | `rack` | `varchar(200)` | NOT NULL | — | — |
| `shelf` | `shelf` | `varchar(200)` | NOT NULL | — | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Indexes: none
- Unique constraints: none (room+rack+shelf uniqueness enforced app-side only)
- References FROM: `items.locationId`
- Business purpose: Physical storage location (room/rack/shelf)

#### 3.2.3 `vendors` — VERIFIED schema.ts:107-112

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `integer` | NOT NULL | generated always as identity | PK |
| `name` | `name` | `varchar(255)` | NULL | — | — |
| `contact` | `contact` | `varchar(255)` | NULL | — | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Indexes: none
- Unique constraints: none
- References FROM: `acquisitions.vendorId`
- Note: Both name and contact are nullable — unusual for vendor entity
- Business purpose: Book/material vendors/suppliers
- **INFERRED:** No module uses this table — no route, controller, or service exists for vendors

#### 3.2.4 `users` — VERIFIED schema.ts:118-144

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `text` | NOT NULL | — | PK (Better Auth string ID) |
| `name` | `name` | `text` | NOT NULL | — | — |
| `email` | `email` | `text` | NOT NULL | — | UNIQUE |
| `emailVerified` | `email_verified` | `boolean` | NOT NULL | — | — |
| `image` | `image` | `text` | NULL | — | — |
| `createdAt` | `created_at` | `timestamp` | NOT NULL | — | — |
| `updatedAt` | `updated_at` | `timestamp` | NOT NULL | — | — |
| `passwordHash` | `password_hash` | `varchar(255)` | NULL | — | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |
| `role` | `role` | `text` | NULL | `"student"` | — |
| `banned` | `banned` | `boolean` | NULL | `false` | — |
| `banReason` | `ban_reason` | `text` | NULL | — | — |
| `banExpires` | `ban_expires` | `timestamp` | NULL | — | — |

- Indexes: `user_deleted_at_idx` on `deletedAt`
- Unique constraints: `email`
- References FROM: `session.userId`, `account.userId`, `members.userId`, `loans.approvedBy`, `logs.userId`, `recommendations.dosenId`, `returnRequests.processedBy`, `transactions.confirmedBy`, `collectionViews.userId`, `webTraffic.userId`
- Business purpose: Authentication user accounts (Better Auth managed)

#### 3.2.5 `session` — VERIFIED schema.ts:146-160

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `text` | NOT NULL | — | PK |
| `expiresAt` | `expires_at` | `timestamp` | NOT NULL | — | — |
| `token` | `token` | `text` | NOT NULL | — | UNIQUE |
| `createdAt` | `created_at` | `timestamp` | NOT NULL | — | — |
| `updatedAt` | `updated_at` | `timestamp` | NOT NULL | — | — |
| `ipAddress` | `ip_address` | `text` | NULL | — | — |
| `userAgent` | `user_agent` | `text` | NULL | — | — |
| `userId` | `user_id` | `text` | NOT NULL | — | FK → users.id |
| `impersonatedBy` | `impersonated_by` | `text` | NULL | — | — |

- Soft-delete: NO
- Business purpose: Better Auth session management

#### 3.2.6 `account` — VERIFIED schema.ts:162-178

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `text` | NOT NULL | — | PK |
| `accountId` | `account_id` | `text` | NOT NULL | — | — |
| `providerId` | `provider_id` | `text` | NOT NULL | — | — |
| `userId` | `user_id` | `text` | NOT NULL | — | FK → users.id |
| `accessToken` | `access_token` | `text` | NULL | — | — |
| `refreshToken` | `refresh_token` | `text` | NULL | — | — |
| `idToken` | `id_token` | `text` | NULL | — | — |
| `accessTokenExpiresAt` | `access_token_expires_at` | `timestamp` | NULL | — | — |
| `refreshTokenExpiresAt` | `refresh_token_expires_at` | `timestamp` | NULL | — | — |
| `scope` | `scope` | `text` | NULL | — | — |
| `password` | `password` | `text` | NULL | — | — |
| `createdAt` | `created_at` | `timestamp` | NOT NULL | — | — |
| `updatedAt` | `updated_at` | `timestamp` | NOT NULL | — | — |

- Soft-delete: NO
- Business purpose: Better Auth OAuth/credential accounts

#### 3.2.7 `verification` — VERIFIED schema.ts:180-187

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `text` | NOT NULL | — | PK |
| `identifier` | `identifier` | `text` | NOT NULL | — | — |
| `value` | `value` | `text` | NOT NULL | — | — |
| `expiresAt` | `expires_at` | `timestamp` | NOT NULL | — | — |
| `createdAt` | `created_at` | `timestamp` | NULL | — | — |
| `updatedAt` | `updated_at` | `timestamp` | NULL | — | — |

- Soft-delete: NO
- Business purpose: Better Auth email/token verification

#### 3.2.8 `members` — VERIFIED schema.ts:193-225

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `userId` | `user_id` | `text` | NOT NULL | — | FK → users.id, UNIQUE |
| `memberType` | `member_type` | `member_type` (enum) | NOT NULL | — | — |
| `nimNidn` | `nim_nidn` | `varchar(255)` | NULL | — | — |
| `faculty` | `faculty` | `varchar(255)` | NULL | — | — |
| `originRegion` | `origin_region` | `varchar(255)` | NULL | — | — |
| `institution` | `institution` | `varchar(255)` | NULL | — | — |
| `phone` | `phone` | `varchar(100)` | NULL | — | — |
| `cardStatus` | `card_status` | `member_card_status` (enum) | NOT NULL | `"not_requested"` | — |
| `cardNumber` | `card_number` | `varchar(100)` | NULL | — | UNIQUE |
| `cardRequestedAt` | `card_requested_at` | `timestamp` | NULL | — | — |
| `cardApprovedAt` | `card_approved_at` | `timestamp` | NULL | — | — |
| `cardRejectedAt` | `card_rejected_at` | `timestamp` | NULL | — | — |
| `cardRejectedReason` | `card_rejected_reason` | `text` | NULL | — | — |
| `createdAt` | `created_at` | `timestamp` | NULL | `now()` | — |
| `updatedAt` | `updated_at` | `timestamp` | NULL | `now()` | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Indexes: `member_nim_idx` on `nimNidn`, `member_deleted_at_idx` on `deletedAt`
- Unique constraints: `user_id`, `card_number`
- References FROM: `loans.memberId`, `reservations.memberId`
- Business purpose: Library member profiles

#### 3.2.9 `collections` — VERIFIED schema.ts:231-246 ⭐ CRITICAL TABLE

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `isbn` | `isbn` | `varchar(255)` | NULL | — | — |
| `title` | `title` | `varchar(255)` | NULL | — | — |
| `author` | `author` | `varchar(255)` | NULL | — | — |
| `publisher` | `publisher` | `varchar(150)` | NULL | — | — |
| `publicationYear` | `publication_year` | `varchar(100)` | NULL | — | — |
| `type` | `type` | `collection_type` (enum) | NULL | — | — |
| `categoryId` | `category_id` | `integer` | NULL | — | FK → categories.id |
| `description` | `description` | `text` | NULL | — | — |
| `image` | `image` | `text` | NULL | — | Cloudinary URL |
| `stock` | `stock` | `integer` | NOT NULL | `0` | — |
| `createdAt` | `created_at` | `timestamp` | NULL | `now()` | — |
| `updatedAt` | `updated_at` | `timestamp` | NULL | `now()` | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Indexes: none
- Unique constraints: none (ISBN not unique — enforced app-side only)
- References FROM: `items.collectionId`, `reservations.collectionId`, `collectionContents.collectionId`, `collectionViews.collectionId`, `acquisitions.collectionId`
- **Missing vs Target Bibliography:** edition, language, callNumber, classification, collation, seriesTitle, placeOfPublication, statementOfResponsibility, subjects/topics (M:N), authors (M:N)
- Business purpose: Library collection catalog (currently flat bibliographic record + stock cache)

#### 3.2.10 `collection_contents` — VERIFIED schema.ts:248-257

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `collectionId` | `collection_id` | `uuid` | NULL | — | FK → collections.id |
| `contentType` | `content_type` | `content_type` (enum) | NULL | — | — |
| `content` | `content` | `text` | NULL | — | — |
| `contentUrl` | `content_url` | `varchar(255)` | NULL | — | — |
| `createdAt` | `created_at` | `timestamp` | NULL | `now()` | — |
| `updatedAt` | `updated_at` | `timestamp` | NULL | `now()` | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Soft-delete: YES
- Business purpose: Digital content for collections (text, PDF, URL)
- **INFERRED:** No dedicated module — no route, controller, or service exists for collection_contents

#### 3.2.11 `collection_views` — VERIFIED schema.ts:259-276

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `collectionId` | `collection_id` | `uuid` | NOT NULL | — | FK → collections.id |
| `userId` | `user_id` | `text` | NULL | — | FK → users.id |
| `ipAddress` | `ip_address` | `varchar(45)` | NULL | — | — |
| `viewedAt` | `viewed_at` | `timestamp` | NULL | `now()` | — |

- Indexes: `cv_collection_idx` on `collectionId`, `cv_viewed_at_idx` on `viewedAt`
- Soft-delete: NO
- Business purpose: Analytics — track who views which collection
- **INFERRED:** No dedicated module uses this table directly

#### 3.2.12 `items` — VERIFIED schema.ts:282-307 ⭐ CRITICAL TABLE

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `collectionId` | `collection_id` | `uuid` | NOT NULL | — | FK → collections.id |
| `barcode` | `barcode` | `varchar(50)` | NULL | — | UNIQUE |
| `uniqueCode` | `unique_code` | `varchar(30)` | NULL | — | UNIQUE |
| `status` | `status` | `item_status` (enum) | NOT NULL | `"available"` | — |
| `locationId` | `location_id` | `integer` | NOT NULL | — | FK → locations.id |
| `createdAt` | `created_at` | `timestamp` | NULL | `now()` | — |
| `updatedAt` | `updated_at` | `timestamp` | NULL | `now()` | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Indexes: `item_collection_idx` on `collectionId`, `item_status_idx` on `status`, `item_deleted_at_idx` on `deletedAt`, `item_location_idx` on `locationId`
- Unique constraints: `barcode`, `unique_code`
- References FROM: `loans.itemId`
- **Missing vs Target Item/Copy:** inventoryCode, supplier/acquisition info, price, receivedDate, QR identity fields
- Business purpose: Individual physical/digital item copies

#### 3.2.13 `loans` — VERIFIED schema.ts:309-343

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `memberId` | `member_id` | `uuid` | NOT NULL | — | FK → members.id |
| `itemId` | `item_id` | `uuid` | NOT NULL | — | FK → items.id |
| `loanDate` | `loan_date` | `date` | NOT NULL | — | — |
| `dueDate` | `due_date` | `date` | NOT NULL | — | — |
| `returnDate` | `return_date` | `date` | NULL | — | — |
| `status` | `status` | `loans_status` (enum) | NOT NULL | — | — |
| `extendCount` | `extend_count` | `integer` | NOT NULL | `0` | max 1 enforced app-side |
| `approvedBy` | `approved_by` | `text` | NULL | — | FK → users.id |
| `verificationToken` | `verification_token` | `varchar(100)` | NULL | — | — |
| `verificationExpiresAt` | `verification_expires_at` | `timestamp` | NULL | — | — |
| `createdAt` | `created_at` | `timestamp` | NULL | `now()` | — |
| `updatedAt` | `updated_at` | `timestamp` | NULL | `now()` | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Indexes: `loan_status_idx`, `loan_deleted_at_idx`, `loan_member_idx`, `loan_item_idx`, `loan_active_idx` (composite on itemId+status), `loan_verification_token_idx`
- References FROM: `fines.loanId`, `returnRequests.loanId`
- Business purpose: Book/material loan transactions

#### 3.2.14 `reservations` — VERIFIED schema.ts:345-357

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `memberId` | `member_id` | `uuid` | NOT NULL | — | FK → members.id |
| `collectionId` | `collection_id` | `uuid` | NOT NULL | — | FK → collections.id |
| `status` | `status` | `reservations_status` (enum) | NOT NULL | — | — |
| `createdAt` | `created_at` | `timestamp` | NULL | `now()` | — |
| `updatedAt` | `updated_at` | `timestamp` | NULL | `now()` | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Indexes: none
- Business purpose: Collection reservation requests by members
- Note: References `collections` (not `items`) — reservation is at catalog level, not copy level

#### 3.2.15 `return_requests` — VERIFIED schema.ts:364-373

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `loanId` | `loan_id` | `uuid` | NOT NULL | — | FK → loans.id |
| `requestedAt` | `requested_at` | `timestamp` | NULL | `now()` | — |
| `status` | `status` | `return_request_status` (enum) | NOT NULL | `"pending"` | — |
| `processedAt` | `processed_at` | `timestamp` | NULL | — | — |
| `processedBy` | `processed_by` | `text` | NULL | — | FK → users.id |

- Soft-delete: NO
- **CONFLICTING:** This table is defined in schema.ts but has NO migration in `drizzle/`. The table does NOT exist in the database. Code in `loan.service.ts` references `returnRequests` — this would fail at runtime.

#### 3.2.16 `fines` — VERIFIED schema.ts:375-386

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `loanId` | `loan_id` | `uuid` | NOT NULL | — | FK → loans.id |
| `amount` | `amount` | `numeric(12,2)` | NULL | — | — |
| `status` | `status` | `fines_status` (enum) | NOT NULL | — | — |
| `lastNotifiedAt` | `last_notified_at` | `timestamp` | NULL | — | — |
| `createdAt` | `created_at` | `timestamp` | NULL | `now()` | — |
| `updatedAt` | `updated_at` | `timestamp` | NULL | `now()` | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Indexes: none
- Note: No `memberId` column — member is resolved through `loans.memberId` join
- Business purpose: Fines issued for overdue/damaged/lost loans

#### 3.2.17 `transactions` — VERIFIED schema.ts:388-399

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `fineId` | `fine_id` | `uuid` | NOT NULL | — | FK → fines.id |
| `paymentMethod` | `payment_method` | `varchar(100)` | NULL | — | — |
| `confirmedBy` | `confirmed_by` | `text` | NOT NULL | — | FK → users.id |
| `paidAt` | `paid_at` | `date` | NULL | — | — |
| `createdAt` | `created_at` | `timestamp` | NULL | `now()` | — |

- Soft-delete: NO
- Business purpose: Fine payment transactions

#### 3.2.18 `acquisitions` — VERIFIED schema.ts:401-412

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `vendorId` | `vendor_id` | `integer` | NOT NULL | — | FK → vendors.id |
| `collectionId` | `collection_id` | `uuid` | NOT NULL | — | FK → collections.id |
| `quantity` | `quantity` | `integer` | NULL | — | — |
| `acquiredAt` | `acquired_at` | `date` | NULL | — | — |
| `createdAt` | `created_at` | `date` | NULL | `now()` | — |

- Soft-delete: NO
- **CONFLICTING:** `createdAt` is `date` type, not `timestamp` — inconsistent with all other tables
- **INFERRED:** No module uses this table — no route, controller, or service exists for acquisitions
- Business purpose: Track new collection acquisitions from vendors

#### 3.2.19 `recommendations` — VERIFIED schema.ts:415-429

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `dosenId` | `dosen_id` | `text` | NOT NULL | — | FK → users.id |
| `isbn` | `isbn` | `varchar(255)` | NULL | — | — |
| `title` | `title` | `varchar(255)` | NULL | — | — |
| `author` | `author` | `varchar(255)` | NULL | — | — |
| `publisher` | `publisher` | `varchar(255)` | NULL | — | — |
| `reason` | `reason` | `text` | NULL | — | — |
| `status` | `status` | `recommendation_status` (enum) | NOT NULL | `"pending"` | — |
| `createdAt` | `created_at` | `timestamp` | NULL | `now()` | — |
| `updatedAt` | `updated_at` | `timestamp` | NULL | `now()` | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Business purpose: Lecturer/dosen book purchase recommendations to librarian

#### 3.2.20 `logs` — VERIFIED schema.ts:435-445

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `userId` | `user_id` | `text` | NULL | — | FK → users.id |
| `action` | `action` | `logs_status` (enum) | NOT NULL | — | — |
| `entity` | `entity` | `logs_entity` (enum) | NOT NULL | — | — |
| `entityId` | `entity_id` | `varchar(255)` | NULL | — | — |
| `ipAddress` | `ip_address` | `varchar(255)` | NULL | — | — |
| `userAgent` | `user_agent` | `text` | NULL | — | — |
| `detail` | `detail` | `text` | NULL | — | — |
| `createdAt` | `created_at` | `timestamp` | NULL | `now()` | — |

- Soft-delete: NO
- Business purpose: Audit trail

#### 3.2.21 `web_traffic` — VERIFIED schema.ts:447-454

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `text` | NOT NULL | — | PK (NOT uuid) |
| `ipAddress` | `ip_address` | `varchar(45)` | NULL | — | — |
| `userId` | `user_id` | `text` | NULL | — | FK → users.id |
| `pageVisited` | `page_visited` | `varchar(255)` | NULL | — | — |
| `visitTimestamp` | `visit_timestamp` | `timestamp` | NULL | `now()` | — |
| `userAgent` | `user_agent` | `text` | NULL | — | — |

- Soft-delete: NO
- Business purpose: Website traffic/page visit analytics

#### 3.2.22 `guest_logs` — VERIFIED schema.ts:460-469

| TS Property | SQL Column | PG Type | Nullable | Default | Constraints |
|---|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `email` | `email` | `varchar(255)` | NULL | — | — |
| `name` | `name` | `varchar(255)` | NOT NULL | — | — |
| `identifier` | `identifier` | `varchar(100)` | NOT NULL | — | — (NIM/NIDN/KTP) |
| `faculty` | `faculty` | `varchar(255)` | NULL | — | — |
| `major` | `major` | `varchar(255)` | NULL | — | — (Prodi) |
| `visitDate` | `visit_date` | `timestamp` | NULL | `now()` | — |
| `deletedAt` | `deleted_at` | `timestamp` | NULL | — | soft-delete |

- Business purpose: Library visitor/guest registration

---

## 4. Existing Relations and Constraints

### 4.1 Relationship Graph — VERIFIED from schema.ts:472-555 and migrations

```
users ──┬── 1:1 ──→ members ──┬── 1:N ──→ loans ──┬── 1:N ──→ fines ── 1:N ──→ transactions
        │                     │                    │
        │                     └── 1:N ──→ reservations ──→ collections
        │
        ├── 1:N ──→ session
        ├── 1:N ──→ account
        ├── 1:N ──→ collectionViews
        ├── 1:N ──→ recommendations (as dosen)
        ├── 1:N ──→ logs
        ├── 1:N ──→ webTraffic
        ├── 1:N ──→ returnRequests (as processedBy)
        ├── 1:N ──→ loans (as approvedBy/approver)
        └── 1:N ──→ transactions (as confirmedBy)

categories ── 1:N ──→ collections ──┬── 1:N ──→ items ──┬── 1:N ──→ loans
                                    ├── 1:N ──→ collectionContents
                                    └── 1:N ──→ collectionViews

locations ── 1:N ──→ items

vendors ── 1:N ──→ acquisitions ──→ collections
```

### 4.2 Cascade Behavior

**ALL foreign keys use `ON DELETE no action` / `ON UPDATE no action`.** Zero cascade deletes anywhere. Verified from `0000_real_captain_britain.sql:230-251`.

### 4.3 Unique Constraints Summary

| Table | Column(s) |
|---|---|
| users | `email` |
| session | `token` |
| items | `barcode`, `unique_code` |
| members | `user_id`, `card_number` |

### 4.4 Index Summary

| Table | Index | Column(s) |
|---|---|---|
| users | `user_deleted_at_idx` | `deleted_at` |
| members | `member_nim_idx` | `nim_nidn` |
| members | `member_deleted_at_idx` | `deleted_at` |
| collectionViews | `cv_collection_idx` | `collection_id` |
| collectionViews | `cv_viewed_at_idx` | `viewed_at` |
| items | `item_collection_idx` | `collection_id` |
| items | `item_status_idx` | `status` |
| items | `item_deleted_at_idx` | `deleted_at` |
| items | `item_location_idx` | `location_id` |
| loans | `loan_status_idx` | `status` |
| loans | `loan_deleted_at_idx` | `deleted_id` |
| loans | `loan_member_idx` | `member_id` |
| loans | `loan_item_idx` | `item_id` |
| loans | `loan_active_idx` | `(item_id, status)` composite |
| loans | `loan_verification_token_idx` | `verification_token` |

### 4.5 Missing Indexes (Performance Risk)

No indexes on: `reservations`, `fines`, `transactions`, `returnRequests`, `recommendations`, `acquisitions`, `logs`, `guestLogs`.

### 4.6 Drizzle Relations Blocks — VERIFIED schema.ts:472-555

| Block | Line | Source | Relations |
|---|---|---|---|
| `userRelations` | 476 | Users | one → members |
| `memberRelations` | 480 | members | one → Users, many → loans |
| `collectionRelations` | 489 | collections | one → categories, many → items, many → collectionContents |
| `itemRelations` | 498 | items | one → collections, one → locations, many → loans |
| `loanRelations` | 510 | loans | one → members, one → items, one → Users (approvedBy) |
| `recommendationRelations` | 525 | recommendations | one → Users (dosenId) |
| `reservationRelations` | 535 | reservations | one → members, one → collections |
| `returnRequestRelations` | 546 | returnRequests | one → loans, one → Users (processedBy) |

**Missing relation blocks:** `fines`, `transactions`, `acquisitions`, `collectionViews`, `webTraffic`, `guestLogs`, `logs`.

---

## 5. Existing Collection Flow

### 5.1 Create Collection

- **Frontend entry:** `AddCollectionModal.tsx:196` — `POST /api/collections` with FormData (cover image + fields)
- **Route:** `collection.route.ts` — `POST /collections` with `upload.single("cover")` middleware
- **Middleware:** `isAuthenticated`, `requireRole(["super_admin", "staff"])`
- **Validation:** `createCollectionSchema` — title(3-255), author(2-255), publisher(2-150), publicationYear(YYYY regex), isbn(optional), type(enum), categoryId(coerced to number), description(optional), stock(optional, min 0)
- **Service:** `collection.service.ts:createCollection` (line 599)
  1. Validate categoryId exists
  2. Check duplicate ISBN (if provided)
  3. Upload cover to Cloudinary
  4. `INSERT collections` with stock=0
  5. If stock > 0: call `syncItemsWithStock` in transaction
- **Stock sync:** Creates items with auto-generated barcodes (`AUTO-{shortId}-{timestamp}-{n}`) using first active location
- **Audit log:** YES — creates log entry with entity="collection", action="create"
- **Tables modified:** `collections`, `items` (if stock>0), `logs`

### 5.2 Update Collection

- **Frontend entry:** `AddCollectionModal.tsx:195` — `PATCH /api/collections/:id` with FormData
- **Service:** `collection.service.ts:updateCollection` (line 723)
  1. Check exists, check duplicate ISBN (excluding self)
  2. Upload new cover if provided (delete old from Cloudinary)
  3. `UPDATE collections`
  4. Call `syncItemsWithStock` with new stock value
- **Audit log:** YES
- **Tables modified:** `collections`, `items`, `logs`

### 5.3 Delete Collection

- **Frontend entry:** `SuperAdminDashboard.tsx:284` — `DELETE /api/collections/:id`
- **Service:** `collection.service.ts:deleteCollection` (line 838)
- **Behavior:** Soft delete only (`deletedAt = new Date()`)
- **Audit log:** YES
- **Tables modified:** `collections`, `logs`

### 5.4 Search/Get Collections

- **Frontend entry:** Multiple — `useBookList`, `useKatalogDetail`, `dashboardDataService`
- **Route:** `GET /collections` (PUBLIC) and `GET /collections/:id` (PUBLIC)
- **Service:** `getAllCollections` (line 546) — search by title/author/isbn (ilike), categoryId, type filters. Limit 100.
- **Service:** `getCollectionById` (line 881) — includes items relation

### 5.5 Import Collections

- **Frontend entry:** `ReportsSection.tsx` — file upload
- **Route:** `POST /collections/import` with `importUpload.single("file")`
- **Service:** `importCollectionsFromFile` (line 235) — reads CSV/XLSX, validates each row with `importCollectionRowSchema`, checks duplicate ISBN in file and DB, validates categoryId, inserts in transaction with `syncItemsWithStock`
- **Template:** `GET /collections/import/template` — generates XLSX with headers: Title, ISBN, Author, Publisher, PublicationYear, Type, CategoryId, Description, Stock

### 5.6 Export Collections

- **NOT FOUND:** No dedicated collection export endpoint exists

---

## 6. Existing Item Flow

### 6.1 Create Item (Single)

- **Frontend entry:** No dedicated frontend form found — items are created via stock sync mechanism
- **Route:** `POST /items` — `isAuthenticated`, `requireRole(["super_admin", "staff"])`
- **Validation:** `createItemSchema` — collectionId(uuid), locationId(int), barcode(1-50), uniqueCode(optional, 1-30), status(default available)
- **Service:** `item.service.ts:createItem` (line 99)
  1. Check barcode duplicate
  2. Check collection exists
  3. Check location exists
  4. `INSERT items`
- **No stock sync on individual item creation** — stock only synced via collection service

### 6.2 Bulk Item Creation

- **NOT FOUND as dedicated endpoint** — bulk creation happens only through `syncItemsWithStock` when collection stock is set/changed

### 6.3 Update Item

- **Route:** `PATCH /items/:id`
- **Service:** `item.service.ts:updateItem` (line 148) — check exists, check barcode duplicate if changed, `UPDATE items`
- **No stock sync triggered**

### 6.4 Delete Item

- **Route:** `DELETE /items/:id`
- **Service:** `item.service.ts:deleteItem` (line 190) — check exists, check not loaned, soft delete (`deletedAt`, status="lost")
- **No stock sync triggered on delete**

### 6.5 Get Items

- **Route:** `GET /items` (PUBLIC) and `GET /items/:id` (PUBLIC)
- **Service:** `getAllItems` (line 17) — with collection+location relations, optional collectionId filter
- **Service:** `getItemById` (line 45) and `getItemByBarcode` (line 72)

### 6.6 Import/Export Items

- **NOT FOUND:** No item import or export endpoint exists

---

## 7. Existing Stock Logic — VERIFIED

### 7.1 Stock is a Denormalized Cache

`collections.stock` = COUNT of items where `status='available' AND deletedAt IS NULL` for that collection.

**File:** `collection.service.ts:452-468` (`syncCollectionAvailableStock`)
**File:** `loan.service.ts:22-38` (duplicate implementation)

### 7.2 Stock Sync Triggers

| Action | Trigger Location | Behavior |
|---|---|---|
| Create collection with stock>0 | `collection.service.ts:670` | Creates items, syncs stock |
| Update collection stock | `collection.service.ts:786` | Creates/removes items, syncs stock |
| Import collections | `collection.service.ts:384` | Creates items per row, syncs stock |
| Approve loan | `loan.service.ts:196` | item→loaned, syncs stock (-1) |
| Reject loan | `loan.service.ts:236` | item→available, syncs stock (+1) |
| Return loan | `loan.service.ts:279` | item→available, syncs stock (+1) |

### 7.3 Duplicate `syncCollectionAvailableStock` Implementation

The same logic is implemented TWICE:
1. `collection.service.ts:452-468`
2. `loan.service.ts:22-38`

Both count available items and update `collections.stock`. This is a code smell — should be shared.

### 7.4 Auto-Generated Barcodes

When stock is increased via `syncItemsWithStock`:
- Barcode format: `AUTO-{collectionId_first_8_chars}-{timestamp}-{index+1}`
- UniqueCode format: `UC-{collectionId_first_8_chars}-{timestamp}-{index+1}`
- Location: First active location found (default)

---

## 8. Existing Loan and Reservation Dependencies

### 8.1 Loan Flow

1. **Member requests loan** (`POST /loans/request`):
   - Check max 3 active loans
   - Check reservation queue vs available items
   - Find first available item for collection
   - Generate crypto token + QR code (2hr expiry)
   - INSERT loan with status="pending"
   - **Tables:** `loans`

2. **Admin approves loan** (`POST /loans/:id/approve`):
   - Transaction: UPDATE loan→approved, UPDATE item→loaned, syncCollectionAvailableStock
   - Send email notification
   - **Tables:** `loans`, `items`, `collections`, `logs`

3. **Admin rejects loan** (`POST /loans/:id/reject`):
   - Transaction: UPDATE loan→rejected, UPDATE item→available, syncCollectionAvailableStock
   - **Tables:** `loans`, `items`, `collections`, `logs`

4. **Member requests return** (`POST /loans/:id/return-request`):
   - INSERT returnRequest with status="pending"
   - **Tables:** `returnRequests`

5. **Admin approves return** (`POST /loans/return-requests/:id/approve`):
   - Transaction: UPDATE loan→returned, UPDATE item→available, syncCollectionAvailableStock
   - fulfillNextReservation (fire-and-forget)
   - Calculate late fine (Rp500/day)
   - **Tables:** `loans`, `items`, `collections`, `returnRequests`, `fines`

6. **Extend loan** (`POST /loans/:id/extend`):
   - Check extendCount < 1, not overdue, no waiting reservations
   - Add 7 days to dueDate
   - **Tables:** `loans`

### 8.2 Reservation Flow

1. **Member creates reservation** (`POST /reservations`):
   - Check collection exists, NO available items, no duplicate waiting, max 3 active
   - INSERT reservation with status="waiting"
   - **Tables:** `reservations`

2. **Auto-fulfill on return** (fire-and-forget from loan return):
   - Find oldest waiting reservation (FIFO)
   - UPDATE→fulfilled, send email
   - **Tables:** `reservations`

3. **Cancel reservation** (`PATCH /reservations/:id/cancel`):
   - Check status="waiting", UPDATE→canceled
   - **Tables:** `reservations`

### 8.3 Fine Flow

- Auto-calculated by cron at 00:01 WIB daily
- Rate: Rp 500/day for overdue loans
- Fine is per loan (not per item directly)
- Payment creates transaction record in `transactions` table

---

## 9. Existing QR Implementation — VERIFIED

### 9.1 QR Generation (Loan Tokens Only)

| Aspect | Detail |
|---|---|
| **Where generated** | `loan.service.ts:113-142` (on loan request) |
| **Entity owner** | `loans` table |
| **Token generation** | `crypto.randomBytes(16).toString("hex")` — 32-char hex |
| **QR encoding** | Token only (NOT a URL, NOT loan ID) |
| **Storage** | `loans.verificationToken` column (indexed) |
| **Expiry** | `loans.verificationExpiresAt` — 2-hour window |
| **Cleanup** | Token nullified on approval (single-use) |
| **QR image storage** | NOT stored in DB — generated on-the-fly via `qrcode.toDataURL()` |
| **Security** | Safe — only random hex token, no sensitive data |

### 9.2 QR Display (Member Side)

- **File:** `MyLoansPage.tsx:282-288`
- Shows QR only when loan status is "pending"
- Renders as `<img src={loan.qrCodeUrl}>` (data:image/png base64)

### 9.3 QR Scanning (Admin Side)

- **File:** `CirculationSection.tsx:262-326`
- Camera scan via `@yudiel/react-qr-scanner`
- Image upload decode via `jsqr`
- Two modes: borrow (verify token → approve/reject) and return (loan ID → return)

### 9.4 Token Verification Endpoint

- `GET /api/loans/verify/:token` — requires `super_admin` or `staff` role
- Returns full loan data with member/item/collection relations

### 9.5 Item QR — NOT IMPLEMENTED

- Items have `barcode` and `uniqueCode` (text strings) but NO QR codes
- `KatalogDetail.tsx:246-248` has a QR button with EMPTY onClick handler — stub only
- No QR generation for individual items exists anywhere

### 9.6 Item Barcode System

- Text-based auto-generated barcodes (not QR)
- Format: `AUTO-{collectionId8chars}-{timestamp}-{index}`
- Unique constraint enforced at DB level

---

## 10. Existing API Contract Matrix

### 10.1 Collection Endpoints

| Method | Route | Auth | Roles | Request | Response | Frontend Consumer |
|---|---|---|---|---|---|---|
| GET | `/api/collections` | No (public) | — | query: search, categoryId, type | `{success, data: Collection[]}` | useBookList, dashboardDataService, useKatalogDetail |
| GET | `/api/collections/:id` | No (public) | — | params: id | `{success, data: Collection}` | useKatalogDetail |
| POST | `/api/collections` | Yes | super_admin, staff | body: title, author, etc + file: cover | `{success, data: Collection}` | AddCollectionModal |
| PATCH | `/api/collections/:id` | Yes | super_admin, staff | body: partial + file: cover | `{success, data: Collection}` | AddCollectionModal |
| DELETE | `/api/collections/:id` | Yes | super_admin, staff | params: id | `{success, message}` | SuperAdminDashboard |
| POST | `/api/collections/import` | Yes | super_admin, staff | file: CSV/XLSX | `{success, data: {imported, errors}}` | ReportsSection |
| GET | `/api/collections/import/template` | Yes | super_admin, staff | — | XLSX file | ReportsSection |

### 10.2 Item Endpoints

| Method | Route | Auth | Roles | Request | Response | Frontend Consumer |
|---|---|---|---|---|---|---|
| GET | `/api/items` | No (public) | — | query: collectionId | `{success, data: Item[]}` | (not directly used in frontend) |
| GET | `/api/items/:id` | No (public) | — | params: id | `{success, data: Item}` | (not directly used in frontend) |
| POST | `/api/items` | Yes | super_admin, staff | body: collectionId, locationId, barcode, uniqueCode, status | `{success, data: Item}` | (no frontend form) |
| PATCH | `/api/items/:id` | Yes | super_admin, staff | body: partial | `{success, data: Item}` | (not directly used) |
| DELETE | `/api/items/:id` | Yes | super_admin, staff | params: id | `{success, message}` | (not directly used) |

### 10.3 Loan Endpoints

| Method | Route | Auth | Roles | Request | Response |
|---|---|---|---|---|---|
| POST | `/api/loans/request` | Yes | any member | body: collectionId, loanDate?, dueDate? | `{success, data: Loan+qrCodeUrl}` |
| GET | `/api/loans/verify/:token` | Yes | super_admin, staff | params: token | `{success, data: Loan}` |
| POST | `/api/loans/:id/approve` | Yes | super_admin, staff | params: id | `{success, data: Loan}` |
| POST | `/api/loans/:id/reject` | Yes | super_admin, staff | params: id, body: reason? | `{success, data: Loan}` |
| POST | `/api/loans/:id/return-request` | Yes | any member | params: id | `{success, data}` |
| POST | `/api/loans/return-requests/:id/approve` | Yes | super_admin | params: id | `{success, data}` |
| GET | `/api/loans/return-requests/pending` | Yes | super_admin | — | `{success, data: ReturnRequest[]}` |
| GET | `/api/loans` | Yes | super_admin, staff | query: status, memberId | `{success, data: Loan[]}` |
| GET | `/api/loans/history` | Yes | any member | — | `{success, data: Loan[]}` |
| POST | `/api/loans/:id/extend` | Yes | super_admin, staff | params: id | `{success, data: Loan}` |

### 10.4 Other Endpoints (Summary)

| Module | Endpoints | Count |
|---|---|---|
| Auth | POST /campus/verify, GET/PATCH /users/* | 5 |
| Category | CRUD /categories | 5 |
| Location | CRUD /locations | 5 |
| Member | GET/PATCH /members/me, card management | 8 |
| Reservation | POST/GET/PATCH /reservations | 4 |
| Fines | GET/POST/DELETE /fines, POST /fines/:id/pay | 7 |
| Notification | POST /notification/send-fines, send-loans | 2 |
| Recommendation | CRUD /recommendations | 5 |
| Audit | GET /logs | 1 |
| Report | GET /reports/*, POST /reports/web-traffic/track | 8 |
| Guest | CRUD /guests, campus user search | 8 |

**Total: ~63 endpoints**

---

## 11. Existing Frontend Dependency Map

### 11.1 Files Affected by Collection Data

| File | Type | Fields Expected |
|---|---|---|
| `types/collection.ts:17-44` | Type | id, title, author, publisher, publicationYear, isbn, type, categoryId, description, image, stock, items[], category |
| `components/dashboard/CollectionsSection.tsx:17-32` | Component | id, title, author, publisher, publicationYear, type, category, categoryId, isbn, stock, image |
| `components/dashboard/AddCollectionModal.tsx:21-36` | Modal | id, title, author, publisher, publicationYear, isbn, type, category, categoryId, stock, image |
| `components/dashboard/CollectionForm.tsx:16-26` | Form | title, author, publisher, publicationYear, isbn, type, categoryId, description, cover |
| `components/dashboard/CollectionGrid.tsx:3-14` | Grid | id, title, author, publisher, publicationYear, type, category, image |
| `components/dashboard/collections/ViewCollectionModal.tsx:12-26` | Modal | id, title, author, publisher, publicationYear, isbn, type, category, categoryId, stock, image |
| `components/BookList.tsx` | List | Collection type from types/collection.ts |
| `pages/Katalog.tsx` | Page | Delegates to BookList |
| `pages/KatalogDetail.tsx` | Page | Full collection + items + similar books |
| `hooks/useBookList.ts` | Hook | Collection[] |
| `hooks/useKatalogDetail.ts` | Hook | Collection + items |
| `hooks/dashboard/useCollectionsData.ts` | Hook | CollectionItem[] |
| `services/dashboard/dashboardDataService.ts:24-39` | Service | CollectionItem type |
| `pages/dashboard/SuperAdminDashboard.tsx` | Page | Collections array + delete handler |

### 11.2 Files Affected by Item Data

| File | Type | Fields Expected |
|---|---|---|
| `KatalogDetail.tsx` | Page | `items: { id, status }[]` (from collection detail) |
| `services/loanService.tsx:3-37` | Service | `item: { id, collectionId, status, collection: { id, title, author, image } }` |
| `components/dashboard/LoansSection.tsx:23-48` | Component | `item: { collection: { title } }` |
| `components/dashboard/CirculationSection.tsx:21-34` | Component | `item: { barcode, collection: { title, author } }` |

### 11.3 Duplicate Type Definitions

| Type | Locations | Conflict |
|---|---|---|
| `DashboardStats` | `useDashboardStats.ts:4`, `dashboardDataService.ts:3`, `types/dashboard.ts:55` | Different fields in each |
| `Loan` | `loanService.tsx:3`, `types/dashboard.ts:31` | Completely different shapes |
| `Reservation` | `reservationService.ts:5`, `types/collection.ts:49` | Service version has more nested fields |
| `Collection` | `CollectionsSection.tsx:17`, `AddCollectionModal.tsx:21`, `CollectionGrid.tsx:3`, `ViewCollectionModal.tsx:12`, `types/collection.ts:17` | 5 separate definitions with slight differences |

### 11.4 No React Query

All data fetching uses raw `useState`/`useEffect`. No shared cache, no query invalidation, no optimistic updates. Each hook manages its own loading/error state independently.

---

## 12. SLiMS Biblio Field Compatibility Matrix

**Note:** No `senayan_biblio_export` CSV file exists in the repository. The following analysis is based on the field list provided in the task prompt, compared against the actual schema.

| SLiMS Field | MUCILIB Status | Current Mapping | Action Required |
|---|---|---|---|
| `title` | **DIRECTLY SUPPORTED** | `collections.title` varchar(255) | — |
| `gmd_name` | **MISSING** | No equivalent | Need new field or enum |
| `edition` | **MISSING** | No equivalent | Need new field on collections/bibliographies |
| `isbn_issn` | **SUPPORTED WITH RENAME** | `collections.isbn` varchar(255) | Rename to `isbnIssn` or split |
| `publisher_name` | **SUPPORTED WITH RENAME** | `collections.publisher` varchar(150) | May need normalization to separate table |
| `publish_year` | **SUPPORTED WITH RENAME** | `collections.publicationYear` varchar(100) | Consider changing to integer |
| `collation` | **MISSING** | No equivalent | Need new field (pages, dimensions) |
| `series_title` | **MISSING** | No equivalent | Need new field |
| `call_number` | **MISSING** | No equivalent | Need new field (Dewey/LoC) |
| `language_name` | **MISSING** | No equivalent | Need new field or enum |
| `place_name` | **MISSING** | No equivalent | Need new field or normalization table |
| `classification` | **MISSING** | No equivalent | Need new field (Dewey Decimal) |
| `notes` | **PARTIALLY SUPPORTED** | `collections.description` text | Rename or add separate notes field |
| `image` | **DIRECTLY SUPPORTED** | `collections.image` text (Cloudinary URL) | — |
| `sor` (statement of responsibility) | **MISSING** | No equivalent | Need new field |
| `authors` | **FLATTENED** | `collections.author` varchar(255) — single string | Need `authors` table + M:N `bibliography_authors` junction |
| `topics` | **FLATTENED** | `categories` — single category per collection | Need `subjects`/`topics` table + M:N junction |
| `item_code` | **AMBIGUOUS** | Could map to `items.barcode` or `items.uniqueCode` | Need clarification on SLiMS item_code vs MUCILIB barcode/uniqueCode |

### Summary

- **Directly supported:** 2 (title, image)
- **Supported with rename:** 3 (isbn, publisher, publicationYear)
- **Partially supported:** 1 (description/notes)
- **Flattened:** 2 (authors, topics)
- **Missing:** 9 (gmd_name, edition, collation, series_title, call_number, language_name, place_name, classification, sor)
- **Requires M:N relation:** 2 (authors, topics/subjects)
- **Requires normalization table:** 3 (publishers, languages, places)
- **Ambiguous:** 1 (item_code)

---

## 13. SLiMS Item Field Compatibility Matrix

**Note:** No `senayan_item_export` CSV file exists in the repository. Analysis based on provided field list.

| SLiMS Field | MUCILIB Status | Current Mapping | Action Required |
|---|---|---|---|
| `item_code` | **SUPPORTED WITH RENAME** | `items.barcode` varchar(50) UNIQUE | Map or rename |
| `call_number` | **MISSING** | No equivalent on items | Need new field (per-item or per-biblio) |
| `coll_type_name` | **PARTIALLY SUPPORTED** | `collections.type` enum (physical_book, ebook, journal, thesis) | May need expansion or item-level override |
| `inventory_code` | **MISSING** | No equivalent | Need new field on items |
| `received_date` | **MISSING** | No equivalent | Need new field on items |
| `supplier_name` | **PARTIALLY SUPPORTED** | `vendors` table exists but NOT connected to items | Need FK from items to vendors or acquisitions |
| `order_no` | **MISSING** | No equivalent on items | Need new field |
| `location_name` | **SUPPORTED WITH RENAME** | `locations` table (room+rack+shelf) | Map via `items.locationId` FK |
| `order_date` | **MISSING** | No equivalent on items | Need new field |
| `item_status_name` | **DIRECTLY SUPPORTED** | `items.status` enum (available, loaned, damaged, lost) | May need value mapping |
| `site` | **MISSING** | No equivalent | Need new field or table |
| `source` | **MISSING** | No equivalent | Need new field |
| `invoice` | **MISSING** | No equivalent | Need new field |
| `price` | **MISSING** | No equivalent | Need new field |
| `price_currency` | **MISSING** | No equivalent | Need new field (default IDR) |
| `invoice_date` | **MISSING** | No equivalent | Need new field |
| `input_date` | **PARTIALLY SUPPORTED** | `items.createdAt` | Map directly |
| `last_update` | **PARTIALLY SUPPORTED** | `items.updatedAt` | Map directly |
| `title` | **AVAILABLE VIA JOIN** | Through `items.collectionId → collections.title` | — |

### Summary

- **Directly supported:** 1 (item_status)
- **Supported with rename:** 2 (item_code→barcode, location_name→locations)
- **Partially supported:** 4 (coll_type, supplier, input_date, last_update)
- **Missing:** 10 (call_number, inventory_code, received_date, order_no, order_date, site, source, invoice, price, price_currency, invoice_date)
- **Available via join:** 1 (title)

---

## 14. Verified Data Quality Risks

### 14.1 Schema Drift Between Code and Database

| Issue | Severity | Details |
|---|---|---|
| `returnRequests` table missing from DB | **CRITICAL** | Defined in schema.ts:364-373 but no migration exists. Code references it — runtime failure. |
| `external` enum value missing | **HIGH** | `member_type` includes "external" in schema.ts:77 but migration never added it. |
| `member_type` has `admin` in initial migration | **MEDIUM** | Changed to `super_admin` in later migration, but `admin` value may still exist in DB enum. |
| `collections.stock` not in initial migration | **LOW** | Added in migration 0001. |

### 14.2 Data Integrity Risks

| Issue | Severity | Details |
|---|---|---|
| No CASCADE on any FK | **HIGH** | All FKs are `no action`. Deleting parent rows fails if children exist. |
| `collections.isbn` not unique | **MEDIUM** | Duplicate check is app-side only. Two concurrent creates could produce duplicates. |
| `collections` most fields nullable | **MEDIUM** | title, author, type, categoryId all nullable — collection could exist with almost no data. |
| `vendors.name` nullable | **LOW** | Vendor without a name is meaningless. |
| `acquisitions.createdAt` is `date` not `timestamp` | **LOW** | Inconsistent with all other tables. |
| `logs_entity` has `"Users"` (PascalCase) | **LOW** | Inconsistent with all other lowercase enum values. |

### 14.3 Business Logic Risks

| Issue | Severity | Details |
|---|---|---|
| Duplicate `syncCollectionAvailableStock` | **MEDIUM** | Same logic in collection.service.ts and loan.service.ts — divergence risk. |
| `extendCount` max 1 not enforced in DB | **LOW** | App-side only — direct DB update could bypass. |
| No stock sync on individual item create/delete | **MEDIUM** | Only synced through collection service operations. |
| Reservation at collection level, not item level | **INFO** | Current design — reservation reserves a title, not a specific copy. |

---

## 15. Proposed Target ERD

```
bibliographies (renamed from collections)
├── id: uuid PK
├── isbn_issn: varchar(255) UNIQUE
├── title: varchar(500) NOT NULL
├── edition: varchar(100)
├── publisher_id: integer FK → publishers.id
├── publish_year: integer
├── collation: varchar(255)          -- pages, dimensions
├── series_title: varchar(255)
├── call_number: varchar(100)
├── language_id: integer FK → languages.id
├── place_id: integer FK → places.id
├── classification: varchar(100)     -- Dewey Decimal
├── notes: text
├── image: text                      -- cover URL
├── sor: text                        -- statement of responsibility
├── gmd_id: integer FK → gmds.id
├── description: text
├── type: collection_type enum
├── category_id: integer FK → categories.id
├── created_at, updated_at, deleted_at

publishers (NEW)
├── id: integer PK
├── name: varchar(255) NOT NULL UNIQUE
├── deleted_at

languages (NEW)
├── id: integer PK
├── code: varchar(10) NOT NULL UNIQUE  -- ISO 639
├── name: varchar(100) NOT NULL
├── deleted_at

places (NEW)
├── id: integer PK
├── name: varchar(255) NOT NULL
├── deleted_at

gmds (NEW) -- General Material Designation
├── id: integer PK
├── name: varchar(100) NOT NULL UNIQUE
├── deleted_at

authors (NEW)
├── id: integer PK
├── name: varchar(255) NOT NULL
├── deleted_at

bibliography_authors (NEW — junction)
├── bibliography_id: uuid FK → bibliographies.id
├── author_id: integer FK → authors.id
├── role: varchar(50)                -- primary, co-author, editor
├── PRIMARY KEY (bibliography_id, author_id)

subjects (NEW)
├── id: integer PK
├── name: varchar(255) NOT NULL
├── deleted_at

bibliography_subjects (NEW — junction)
├── bibliography_id: uuid FK → bibliographies.id
├── subject_id: integer FK → subjects.id
├── PRIMARY KEY (bibliography_id, subject_id)

items (ENHANCED)
├── id: uuid PK
├── bibliography_id: uuid FK → bibliographies.id (renamed from collection_id)
├── item_code: varchar(50) UNIQUE    -- renamed from barcode
├── inventory_code: varchar(50) UNIQUE -- NEW
├── call_number: varchar(100)        -- per-item override
├── location_id: integer FK → locations.id
├── vendor_id: integer FK → vendors.id  -- NEW
├── received_date: date              -- NEW
├── order_no: varchar(100)           -- NEW
├── order_date: date                 -- NEW
├── source: varchar(255)             -- NEW
├── invoice: varchar(255)            -- NEW
├── price: numeric(12,2)             -- NEW
├── price_currency: varchar(10)      -- NEW, default 'IDR'
├── invoice_date: date               -- NEW
├── site: varchar(255)               -- NEW
├── status: item_status enum
├── qr_token: varchar(100) UNIQUE    -- NEW
├── qr_version: integer              -- NEW
├── qr_generated_at: timestamp       -- NEW
├── qr_revoked_at: timestamp         -- NEW
├── created_at, updated_at, deleted_at

loans (UNCHANGED mostly)
├── verification_token → references items.qr_token instead
```

---

## 16. Proposed Backend Architecture

### 16.1 New/Modified Modules

| Module | Change | Files Affected |
|---|---|---|
| `bibliography` | Rename from `collection`, add fields | route, controller, service, validation |
| `item` | Add acquisition/QR fields | service, validation |
| `author` | NEW module | route, controller, service, validation |
| `subject` | NEW module | route, controller, service, validation |
| `publisher` | NEW module (or inline) | route, controller, service, validation |
| `language` | NEW module (or inline) | route, controller, service, validation |
| `place` | NEW module (or inline) | route, controller, service, validation |
| `gmd` | NEW module (or inline) | route, controller, service, validation |
| `qr` | NEW module | route, controller, service |
| `import` | NEW or expanded | CSV staging, validation, mapping |

### 16.2 Shared Stock Sync

Move `syncCollectionAvailableStock` to a shared utility (e.g., `modules/shared/utils/stock-sync.ts`).

---

## 17. Proposed Frontend Flow

### 17.1 Bibliography Management

1. Search bibliography (expanded search: title, ISBN, author, subject, call number)
2. View bibliography detail (with all metadata, authors list, subjects list)
3. Create bibliography (form with all new fields)
4. Edit bibliography
5. Delete bibliography (soft)

### 17.2 Item/Copy Management

1. View items under a bibliography
2. Add single item (form with acquisition fields)
3. Add items in bulk (table/grid input)
4. Edit item
5. Delete item (soft)
6. Generate QR per item
7. Download QR / Print label

### 17.3 Import/Export

1. Import bibliography CSV (with field mapping UI)
2. Import item CSV (with field mapping UI)
3. Export bibliography CSV/Excel
4. Export item CSV/Excel

### 17.4 QR/Circulation

1. Scan QR during checkout → resolve item → create loan
2. Scan QR during return → resolve loan → process return
3. Bulk print labels (multiple items at once)

---

## 18. QR Ownership and Lifecycle

### 18.1 Current State

- QR belongs to **loan** (verification token)
- Generated on loan request, destroyed on approval
- Used for admin verification only

### 18.2 Target State

- QR belongs to **item** (per physical copy)
- Generated on item creation
- Persists until revoked
- Used for circulation (checkout/return) and catalog lookup

### 18.3 Recommended QR Schema

```
items.qr_token: varchar(100) UNIQUE NOT NULL
items.qr_version: integer DEFAULT 1
items.qr_generated_at: timestamp
items.qr_revoked_at: timestamp (nullable — null means active)
```

### 18.4 QR Payload

- Must NOT contain sensitive data
- Should contain: opaque token only (e.g., `qr_token` value)
- Resolution via: `GET /api/qr/resolve/:token` → returns item + bibliography data
- Frontend: token encoded as QR image, generated on-the-fly (not stored as image)

### 18.5 QR Security

- Token uniqueness enforced by DB UNIQUE constraint
- Revocation via `qr_revoked_at` (soft revoke)
- Regeneration creates new token, increments version
- Collision risk: negligible with 32+ char random hex

---

## 19. Migration Plan

### 19.1 Pre-Migration

1. Full database backup (`pg_dump`)
2. Row count snapshot of all tables
3. Data profiling (NULL counts, duplicate detection, orphan detection)

### 19.2 Phase 1: Additive-Only (Safe)

- Add new tables: `publishers`, `languages`, `places`, `gmds`, `authors`, `subjects`, `bibliography_authors`, `bibliography_subjects`
- Add new columns to `collections` (nullable): `edition`, `series_title`, `call_number`, `classification`, `collation`, `sor`, `language_id`, `place_id`, `publisher_id`, `gmd_id`
- Add new columns to `items` (nullable): `inventory_code`, `vendor_id`, `received_date`, `order_no`, `order_date`, `source`, `invoice`, `price`, `price_currency`, `invoice_date`, `site`, `qr_token`, `qr_version`, `qr_generated_at`, `qr_revoked_at`
- Add missing `returnRequests` migration
- Add `external` to `member_type` enum
- Add missing indexes

### 19.3 Phase 2: Data Backfill

- Populate `publishers` from distinct `collections.publisher` values
- Populate `languages` with default set (id, en, etc.)
- Generate `qr_token` for all existing items
- Migrate `collections.author` → `authors` + `bibliography_authors`
- Migrate `collections.category_id` → `bibliography_subjects` (if categories map to subjects)

### 19.4 Phase 3: Rename (Optional, Reversible)

- Rename `collections` → `bibliographies` (via view for compatibility)
- Rename `items.barcode` → `items.item_code`
- Create compatibility view: `CREATE VIEW collections AS SELECT * FROM bibliographies`

### 19.5 Phase 4: Constraint Activation

- Add UNIQUE on `bibliographies.isbn_issn`
- Add NOT NULL on `bibliographies.title`
- Add NOT NULL on `items.item_code`

### 19.6 Rollback Strategy

- Phase 1: Drop new columns/tables (data loss only for new data)
- Phase 2: Delete backfilled data
- Phase 3: Drop compatibility view, rename back
- Phase 4: Drop constraints

---

## 20. Backend Refactor Plan

### 20.1 Schema Changes (`src/db/schema.ts`)

| Change | Lines Affected | Risk |
|---|---|---|
| Add 8 new tables | New code | LOW |
| Add ~15 new columns to `collections` | :231-246 | LOW (nullable) |
| Add ~15 new columns to `items` | :282-307 | LOW (nullable) |
| Add new relation blocks | :472-555 | LOW |
| Rename `collections` → `bibliographies` | Everywhere | HIGH |

### 20.2 Service Changes

| File | Change |
|---|---|
| `collection.service.ts` | Major rewrite — add all new fields, author/subject handling |
| `item.service.ts` | Add acquisition fields, QR generation |
| `loan.service.ts` | Update QR to use item QR token |
| New: `qr.service.ts` | QR generation, resolution, revocation |
| New: `author.service.ts` | CRUD for authors |
| New: `subject.service.ts` | CRUD for subjects |
| `shared/utils/stock-sync.ts` | Extract shared stock sync |

### 20.3 Validation Changes

| File | Change |
|---|---|
| `collection.validation.ts` | Add all new fields |
| `item.validation.ts` | Add acquisition/QR fields |
| `loan.validation.ts` | Update to use item QR token |

---

## 21. Frontend Refactor Plan

### 21.1 Type Changes

| File | Change |
|---|---|
| `types/collection.ts` | Rename to `types/bibliography.ts`, add all new fields, add Author, Subject types |
| `types/dashboard.ts` | Update CollectionItem, add ItemDetail type |
| `services/loanService.tsx` | Update Loan type with new item fields |
| `services/dashboard/dashboardDataService.ts` | Update CollectionItem |

### 21.2 Component Changes

| Component | Change |
|---|---|
| `AddCollectionModal.tsx` | Major rewrite — add all new fields, author picker, subject picker |
| `CollectionForm.tsx` | Major rewrite |
| `CollectionsSection.tsx` | Update table columns, add new fields display |
| `CollectionGrid.tsx` | Update card display |
| `ViewCollectionModal.tsx` | Add all new fields display |
| `BookList.tsx` | Update Collection type |
| `KatalogDetail.tsx` | Show all new metadata, item list with QR |
| `CirculationSection.tsx` | Update to scan item QR instead of loan token |
| `LoansSection.tsx` | Minor updates |
| `ReportsSection.tsx` | Update import/export |

### 21.3 New Components Needed

| Component | Purpose |
|---|---|
| `ItemManagementSection.tsx` | Admin item CRUD under a bibliography |
| `QRGenerator.tsx` | QR generation/display/download |
| `BulkItemForm.tsx` | Bulk item creation form |
| `LabelPrinter.tsx` | Bulk label printing |
| `AuthorPicker.tsx` | Multi-select author picker |
| `SubjectPicker.tsx` | Multi-select subject picker |
| `ImportMappingUI.tsx` | CSV field mapping interface |

---

## 22. Testing Plan

### 22.1 Current Test Coverage

| Module | Validation | Controller | Service | Integration |
|---|---|---|---|---|
| Auth | ✅ | ✅ | ✅ | ❌ |
| Category | ❌ | ✅ | ✅ | ❌ |
| Collection | ✅ | ❌ | ❌ | ❌ |
| Fines | ❌ | ✅ | ✅ | ❌ |
| Guest | ✅ | ❌ | ❌ | ❌ |
| Item | ✅ | ❌ | ❌ | ❌ |
| Loan | ❌ | ✅ | ✅ | ❌ |
| Location | ✅ | ❌ | ❌ | ❌ |
| Member | ✅ | ❌ | ❌ | ❌ |
| Notification | ✅ | ❌ | ⚠️ | ❌ |
| Recommendation | ✅ | ❌ | ❌ | ❌ |
| Report | ✅ | ❌ | ❌ | ❌ |
| Reservation | ✅ | ❌ | ❌ | ❌ |
| Cron/FineScheduler | ❌ | N/A | ✅ | ❌ |

### 22.2 Required New Tests

| Test | Priority | Module |
|---|---|---|
| Bibliography CRUD | HIGH | bibliography |
| Author CRUD + junction | HIGH | author |
| Subject CRUD + junction | HIGH | subject |
| Single item creation | HIGH | item |
| Bulk item creation | HIGH | item |
| Duplicate item_code handling | HIGH | item |
| Duplicate inventory_code handling | HIGH | item |
| QR generation per item | HIGH | qr |
| QR resolution | HIGH | qr |
| QR regeneration/revocation | HIGH | qr |
| Stock count after item create/delete | HIGH | item |
| Loan with item QR scan | HIGH | loan |
| Return with item QR scan | HIGH | loan |
| CSV import bibliography | MEDIUM | import |
| CSV import items | MEDIUM | import |
| CSV duplicate rows | MEDIUM | import |
| Transaction rollback on failure | HIGH | all |
| RBAC enforcement | MEDIUM | all |
| Audit trail verification | MEDIUM | audit |

### 22.3 Frontend Tests Needed

| Test | Priority |
|---|---|
| Bibliography form validation | HIGH |
| Item form validation | HIGH |
| QR display/download | MEDIUM |
| Cache invalidation after mutation | HIGH |
| Loading/empty/error/success states | MEDIUM |

---

## 23. File-by-File Change Matrix

### 23.1 Backend Files

| File | Change Type | Description |
|---|---|---|
| `src/db/schema.ts` | MODIFY | Add 8 tables, ~30 columns, relations |
| `src/db/seed.ts` | MODIFY | Update seed data for new schema |
| `src/modules/collection/` | RENAME+MODIFY | → `bibliography/`, add fields, author/subject handling |
| `src/modules/item/service/item.service.ts` | MODIFY | Add acquisition, QR, bulk creation |
| `src/modules/item/validation/item.validation.ts` | MODIFY | Add new fields |
| `src/modules/item/route/item.route.ts` | MODIFY | Add bulk creation endpoint |
| `src/modules/loan/service/loan.service.ts` | MODIFY | Update QR logic to use item QR |
| `src/modules/loan/controller/loan.controller.ts` | MODIFY | Update verify to resolve item QR |
| `src/modules/loan/route/loan.route.ts` | MODIFY | Update verify route |
| `src/modules/reservation/service/reservation.service.ts` | MODIFY | Update to use bibliography reference |
| `src/modules/report/service/report.service.ts` | MODIFY | Update queries for new schema |
| `src/routes/index.ts` | MODIFY | Add new module routes |
| `src/utils/upload.ts` | NO CHANGE | — |
| `src/utils/auth-types.ts` | NO CHANGE | — |
| `src/modules/shared/` | MODIFY | Add stock-sync utility |
| NEW: `src/modules/author/` | CREATE | Full CRUD module |
| NEW: `src/modules/subject/` | CREATE | Full CRUD module |
| NEW: `src/modules/qr/` | CREATE | QR generation, resolution, revocation |
| NEW: `drizzle/0010_*.sql` | CREATE | Phase 1 migration |

### 23.2 Frontend Files

| File | Change Type | Description |
|---|---|---|
| `src/types/collection.ts` | MODIFY | Add all new types (Author, Subject, etc.) |
| `src/types/dashboard.ts` | MODIFY | Update types |
| `src/services/loanService.tsx` | MODIFY | Update Loan type |
| `src/services/dashboard/dashboardDataService.ts` | MODIFY | Update CollectionItem type |
| `src/components/dashboard/AddCollectionModal.tsx` | MAJOR MODIFY | New form fields |
| `src/components/dashboard/CollectionForm.tsx` | MAJOR MODIFY | New form fields |
| `src/components/dashboard/CollectionsSection.tsx` | MODIFY | New table columns |
| `src/components/dashboard/CollectionGrid.tsx` | MODIFY | New card display |
| `src/components/dashboard/collections/ViewCollectionModal.tsx` | MODIFY | New detail fields |
| `src/components/dashboard/CirculationSection.tsx` | MODIFY | Update QR scan logic |
| `src/components/dashboard/LoansSection.tsx` | MINOR MODIFY | Display updates |
| `src/components/dashboard/ReportsSection.tsx` | MODIFY | Import/export updates |
| `src/components/BookList.tsx` | MODIFY | Updated Collection type |
| `src/pages/KatalogDetail.tsx` | MODIFY | Show new metadata |
| `src/hooks/useBookList.ts` | MODIFY | Updated types |
| `src/hooks/useKatalogDetail.ts` | MODIFY | Updated types |
| `src/hooks/dashboard/useCollectionsData.ts` | MODIFY | Updated types |
| NEW: `src/components/dashboard/ItemManagementSection.tsx` | CREATE | Item CRUD |
| NEW: `src/components/dashboard/QRGenerator.tsx` | CREATE | QR display/download |
| NEW: `src/components/dashboard/BulkItemForm.tsx` | CREATE | Bulk item creation |
| NEW: `src/components/dashboard/LabelPrinter.tsx` | CREATE | Bulk label printing |

---

## 24. Risks and Rollback Plan

### 24.1 High-Risk Changes

| Change | Risk | Mitigation |
|---|---|---|
| Rename `collections` → `bibliographies` | Breaks all references | Use compatibility view; rename in Phase 3 only |
| Add NOT NULL on `bibliographies.title` | Fails if NULL data exists | Backfill first, then add constraint |
| Change `items.barcode` → `items.item_code` | Breaks all references | Add column first, backfill, then rename |
| Add QR to all existing items | Large data migration | Batch processing, progress tracking |
| Author M:N normalization | Data loss if author strings are messy | Preserve original string as fallback |

### 24.2 Rollback Procedures

1. **Phase 1 rollback:** `DROP COLUMN`, `DROP TABLE` for new additions
2. **Phase 2 rollback:** `DELETE` backfilled rows, `TRUNCATE` junction tables
3. **Phase 3 rollback:** `DROP VIEW`, rename back
4. **Full rollback:** Restore from `pg_dump` backup

### 24.3 Compatibility Period

- Maintain `collections` view for 2-4 weeks after rename
- Backend routes accept both old and new field names during transition
- Frontend deploys after backend is stable

---

## 25. Open Business Decisions

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | Keep `collections` name or rename to `bibliographies`? | Rename vs keep | Rename with compatibility view |
| 2 | Categories → Subjects mapping? | 1:1 migration vs separate subjects table | Separate subjects table (categories may stay for backward compat) |
| 3 | Publisher normalization? | Inline field vs separate table | Separate table (normalize existing data) |
| 4 | Author string parsing strategy? | Manual vs automated NLP | Manual with fallback to original string |
| 5 | Item QR on creation or on demand? | Auto-generate vs manual trigger | Auto-generate on creation |
| 6 | SLiMS `item_code` maps to `barcode` or `uniqueCode`? | barcode vs uniqueCode vs new field | Clarify with stakeholders |
| 7 | Per-item `call_number` or per-bibliography? | Item-level vs biblio-level | Both (biblio default, item override) |
| 8 | `stock` column keep or remove? | Keep as cache vs remove and compute on-demand | Keep as cache (current pattern works) |
| 9 | Reservation level: bibliography or item? | Current (bibliography) vs item-level | Keep bibliography-level (matches current business logic) |
| 10 | Fine rate configurable? | Hardcoded Rp500 vs database setting | Make configurable (add `settings` table) |
| 11 | Import staging tables? | Direct import vs staging+review | Staging tables for data quality |
| 12 | `external` member type — add or remove? | Add vs remove from enum | Clarify with stakeholders |

---

## 26. Final Recommendation

### Immediate Actions (Before Refactor)

1. **Create migration for `returnRequests` table** — CRITICAL: code references table that doesn't exist in DB
2. **Add `external` to `member_type` enum** — if external members are needed
3. **Fix `acquisitions.createdAt` type** — change from `date` to `timestamp`
4. **Add missing indexes** on `reservations`, `fines`, `logs`, `recommendations`

### Refactor Sequence

1. **Phase 1 (Week 1-2):** Add new tables and columns (additive only, no breaking changes)
2. **Phase 2 (Week 3):** Data backfill (publishers, authors, subjects, QR tokens)
3. **Phase 3 (Week 4):** Rename collections → bibliographies with compatibility view
4. **Phase 4 (Week 5):** Frontend refactor (new forms, new types, QR components)
5. **Phase 5 (Week 6):** Testing, data validation, SLiMS import implementation

### Critical Path Items

1. Schema.ts changes (blocks everything)
2. Author/Subject junction tables (blocks bibliography form)
3. Item QR fields (blocks circulation refactor)
4. QR service (blocks frontend QR components)

---

## Appendix A: Files Inspected

### Backend
- `library-be/package.json`
- `library-be/drizzle.config.ts`
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
- `library-be/src/types/qrcode.d.ts`
- All 14 module directories (routes, controllers, services, validations, tests)
- `library-be/drizzle/0000_real_captain_britain.sql` through `0009_fine_notification_daily_limit.sql`
- `library-be/drizzle/meta/_journal.json`

### Frontend
- `library-fe/package.json`
- `library-fe/src/routes/index.tsx`
- `library-fe/src/routes/NonAdminRoute.tsx`
- `library-fe/src/routes/PublicRoute.tsx`
- `library-fe/src/pages/Katalog.tsx`
- `library-fe/src/pages/KatalogDetail.tsx`
- `library-fe/src/pages/MyLoansPage.tsx`
- `library-fe/src/pages/Profile.tsx`
- `library-fe/src/pages/dashboard/SuperAdminDashboard.tsx`
- All `components/dashboard/*.tsx` files
- All `hooks/*.ts` and `hooks/dashboard/*.ts` files
- All `services/*.tsx` and `services/dashboard/*.ts` files
- All `types/*.ts` files
- All `utils/*.ts` files
- `library-fe/src/context/ToastContext.tsx`
- `library-fe/src/components/ProtectedRoute.tsx`

---

## Appendix B: Commands Executed

```bash
# Git
git log --oneline -10
git status --short

# File discovery (PowerShell)
Get-ChildItem -Recurse -Include "*.csv","*.xlsx","*.docx"
```

No build, test, or migration commands were executed (read-only audit).

---

## Appendix C: Assumptions

1. The SLiMS/Senayan export CSV files and SRS document will be provided separately — they are not in the repository.
2. The target Bibliography+Item/Copy model is the desired end state.
3. Existing production data must be preserved (zero data loss).
4. The refactor should be incremental, not a big-bang rewrite.
5. Cookie-based auth via Better Auth (`credentials: "include"`) will continue to be used.

---

## Appendix D: Unresolved Questions

1. Is `returnRequests` table actually used in production? (No migration exists)
2. What is the actual value of `member_type` enum in the production DB? (Schema says `external` but migration never added it)
3. How should SLiMS `item_code` map to MUCILIB fields?
4. Should categories be migrated to subjects, or should both coexist?
5. What is the expected SLiMS import volume? (Affects staging table design)
6. Is there a need for multi-site support (SLiMS `site` field)?
7. Should fine rate be configurable per member type?
8. What happens to existing auto-generated barcodes (`AUTO-*`) during migration?

---

## Appendix E: Git Status

```
Branch: main (latest commit: a4a3bc8)
Working tree: clean (only ANALISIS_PROYEK.md untracked)
```

---

## Appendix F: Confirmation

**No source files were modified during this audit.** All analysis was performed by reading files only. The only file created was `ANALYSIS_PROYEK.md` (user-requested summary) and this audit report `EXISTING_SCHEMA_AND_REFACTOR_AUDIT.md`.
