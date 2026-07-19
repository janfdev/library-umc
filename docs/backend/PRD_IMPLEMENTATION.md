# PRD Implementation — Backend Guide

Based on `docs/superpowers/PRD.md` with revisions from discussion (2026-07-19).
Focus: FR-12 (Duplicate Detection) & FR-14 (Faculty/Study Program).

---

## System Architecture Overview

```
library-fe (React 19)
    ↓ HTTP
library-be (Express 5 + TypeScript + Drizzle ORM + PostgreSQL)
    ↓ Schema
db/schema.ts (25+ tables)
```

**Existing modules:** auth, bibliography, item, loan, member, category, location, reservation, fines, guest, recommendation, import, export, audit, report, notification, collection (alias).

**Pattern per module:**
```
src/modules/{name}/
  route/{name}.route.ts       → express.Router + JSDoc @swagger
  controller/{name}.controller.ts → Zod safeParse + sendSuccess/sendError/sendValidationError
  service/{name}.service.ts   → drizzle-orm queries + audit logging
  validation/{name}.validation.ts → Zod schemas
```

**Auth:** `isAuthenticated` + `requireRole(["super_admin", "staff"])` middleware.

---

## FR-12: Deteksi Duplikat Bibliografi

### Flow

```
User fills create bibliography form (title, isbn, author, etc.)
       ↓
Frontend calls: GET /api/bibliographies/check-duplicate?isbn=XXX&title=YYY&author=ZZZ
  (dipanggil saat form blur / onchange, seperti live search)
       ↓
Backend checks (in order):
  1. ISBN exact match    → WHERE isbn_issn = input && deleted_at IS NULL
  2. Title + Author fuzzy → ILIKE title + author name ILIKE via bibliography_authors JOIN
       ↓
Response: { success: true, data: { duplicates: [...], hasExactMatch: bool } }
  duplicates[] = { id, title, isbnIssn, authors: [...], similarity: "isbn"|"title_author" }
  Empty array if no match found.
       ↓
Frontend:
  - If duplicates.length > 0:
    → Tampilkan suggestion card/list di form: "Buku ini sudah ada. Tambahkan item saja?"
    → Klik salah satu duplicate → redirect ke halaman bibliografi yang sudah ada
    → User bisa langsung add items (perbanyak stok) ke bibliografi yang sudah ada tsb
  - If no duplicates: proceed normal create
```

Key point: Backend tidak mengubah create/update flow. Hanya menyediakan data. Keputusan navigasi ada di Frontend.

### API Spec

**`GET /api/bibliographies/check-duplicate`** — Public (no auth)

Query params:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `isbn` | string | no | ISBN/ISSN to match exactly |
| `title` | string | no | Title for fuzzy matching |
| `author` | string | no | Author name for fuzzy matching |

At least one param required.

Response `200`:
```json
{
  "success": true,
  "message": "Duplicate check completed",
  "data": {
    "hasExactMatch": true,
    "duplicates": [
      {
        "id": "uuid",
        "title": "Pemrograman Web",
        "isbnIssn": "ISBN 978-602-1234-56-7",
        "classification": "005.1",
        "callNumber": "005.1 BUD p",
        "authors": [{ "name": "Budi" }],
        "similarity": "isbn"
      }
    ]
  }
}
```

### Schema Changes (none needed)

Uses existing `bibliographies.isbnIssn`, `bibliographies.title`, and `bibliography_authors` + `authors` JOIN.

### Implementation Checklist

- [ ] Add `checkDuplicate` method to `bibliography.service.ts`
  - [ ] If `isbn` provided: `SELECT ... WHERE isbn_issn = input AND deleted_at IS NULL` → return with `similarity: "isbn"`
  - [ ] Set `hasExactMatch = true` if any ISBN exact match found
  - [ ] If `title` (+ optionally `author`) provided: `SELECT ... WHERE title ILIKE %input% AND deleted_at IS NULL` → JOIN `bibliography_authors` + `authors` → if `author` param present, filter by `authors.name ILIKE %author%` → `similarity: "title_author"`
  - [ ] Return combined unique results (deduplicate by id)
    - [ ] Include: `id, title, isbnIssn, classification, callNumber, authors`
- [ ] Add `checkDuplicate` handler to `bibliography.controller.ts`
  - [ ] Zod validation: `z.object({ isbn: z.string().optional(), title: z.string().optional(), author: z.string().optional() }).refine(d => d.isbn || d.title || d.author, "At least one param required")`
  - [ ] Call service, return `sendSuccess`
- [ ] Add route `GET /check-duplicate` to `bibliography.route.ts`
  - [ ] Public (no auth)
  - [ ] Register BEFORE `/:id` to avoid route conflict
- [ ] Add JSDoc `@swagger` comment on route
- [ ] Add swagger path to `swagger.ts`

### Route Registration Order

```typescript
// Must be before /:id routes to avoid "check-duplicate" matched as :id
router.get("/bibliographies/check-duplicate", ...);
router.get("/bibliographies", ...);
router.get("/bibliographies/:id", ...);
```

---

## FR-14: Filter/Sortir Prodi & Fakultas

### Flow

```
Database (M:N):
  faculties ──< bibliography_faculties >── bibliographies ──< bibliography_study_programs >── study_programs
  
  "ALL" concept:
    - Jika bibliography TIDAK punya row di bibliography_faculties → muncul di filter fakultas MANAPUN
    - Jika bibliography punya row di bibliography_faculties → hanya muncul di fakultas tsb
    - Sama untuk study_programs
    - Contoh: buku "Metode Penelitian" tanpa faculty/prodi assignment → muncul di ALL filter

Admin CRUD:
  Super Admin: CRUD faculties + study_programs
  Staff: Read-only (for dropdown selection)

Bibliography Create/Update:
  Admin form → multi-select faculty + study_program
  Jika tidak dipilih sama sekali → ALL (muncul di mana saja)

Catalog Filter:
  User → dropdown "Fakultas" dan/atau "Program Studi"
  GET /bibliographies?facultyId=1&studyProgramId=5
  Backend logic:
    - Jika filter facultyId ada: tampilkan bib yang punya faculty tsb ATAU tanpa faculty sama sekali (ALL)
    - Jika filter studyProgramId ada: tampilkan bib yang punya prodi tsb ATAU tanpa prodi sama sekali (ALL)
```

### Schema Changes

New tables in `schema.ts`:

```typescript
// ── FACULTIES ──
export const faculties = pgTable("faculties", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
});

// ── STUDY PROGRAMS ──
export const studyPrograms = pgTable("study_programs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  facultyId: integer("faculty_id").notNull().references(() => faculties.id),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  facultyIdx: index("sp_faculty_idx").on(table.facultyId)
}));

// ── BIBLIOGRAPHY FACULTIES (M:N junction) ──
export const bibliographyFaculties = pgTable("bibliography_faculties", {
  id: uuid("id").primaryKey().defaultRandom(),
  bibliographyId: uuid("bibliography_id").notNull().references(() => bibliographies.id),
  facultyId: integer("faculty_id").notNull().references(() => faculties.id),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  unique: unique("bf_unique").on(table.bibliographyId, table.facultyId),
  bibIdx: index("bf_bibliography_idx").on(table.bibliographyId),
  facultyIdx: index("bf_faculty_idx").on(table.facultyId)
}));

// ── BIBLIOGRAPHY STUDY PROGRAMS (M:N junction) ──
export const bibliographyStudyPrograms = pgTable("bibliography_study_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  bibliographyId: uuid("bibliography_id").notNull().references(() => bibliographies.id),
  studyProgramId: integer("study_program_id").notNull().references(() => studyPrograms.id),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  unique: unique("bsp_unique").on(table.bibliographyId, table.studyProgramId),
  bibIdx: index("bsp_bibliography_idx").on(table.bibliographyId),
  spIdx: index("bsp_study_program_idx").on(table.studyProgramId)
}));
```

Add relations:

```typescript
export const facultyRelations = relations(faculties, ({ many }) => ({
  studyPrograms: many(studyPrograms),
  bibliographyFaculties: many(bibliographyFaculties)
}));

export const studyProgramRelations = relations(studyPrograms, ({ one, many }) => ({
  faculty: one(faculties, { fields: [studyPrograms.facultyId], references: [faculties.id] }),
  bibliographyStudyPrograms: many(bibliographyStudyPrograms)
}));

export const bibliographyFacultyRelations = relations(bibliographyFaculties, ({ one }) => ({
  bibliography: one(bibliographies, { fields: [bibliographyFaculties.bibliographyId], references: [bibliographies.id] }),
  faculty: one(faculties, { fields: [bibliographyFaculties.facultyId], references: [faculties.id] })
}));

export const bibliographyStudyProgramRelations = relations(bibliographyStudyPrograms, ({ one }) => ({
  bibliography: one(bibliographies, { fields: [bibliographyStudyPrograms.bibliographyId], references: [bibliographies.id] }),
  studyProgram: one(studyPrograms, { fields: [bibliographyStudyPrograms.studyProgramId], references: [studyPrograms.id] })
}));

// Add to existing bibliographyRelations:
bibliographyFaculties: many(bibliographyFaculties),
bibliographyStudyPrograms: many(bibliographyStudyPrograms),
```

### API Spec

#### Faculties CRUD

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/faculties` | Public | List all active |
| `GET` | `/api/faculties/:id` | Public | Get by ID (include study programs) |
| `POST` | `/api/faculties` | super_admin | Create |
| `PATCH` | `/api/faculties/:id` | super_admin | Update |
| `DELETE` | `/api/faculties/:id` | super_admin | Soft delete (check usage) |

**`POST /api/faculties`** request:
```json
{
  "name": "Fakultas Teknik",
  "code": "FT"
}
```

**DELETE**: Check if any study_programs or bibliography_faculties reference this faculty. If yes → 409.

#### Study Programs CRUD

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/study-programs` | Public | List all (optional `?facultyId=` filter) |
| `GET` | `/api/study-programs/:id` | Public | Get by ID |
| `POST` | `/api/study-programs` | super_admin | Create |
| `PATCH` | `/api/study-programs/:id` | super_admin | Update |
| `DELETE` | `/api/study-programs/:id` | super_admin | Soft delete (check usage) |

**`GET /api/study-programs?facultyId=1`** — filter by faculty.

**DELETE**: Check if any bibliography_study_programs reference this. If yes → 409.

#### Bibliography Create/Update — Faculty & Study Program

Add to `createBibliographySchema` and `updateBibliographySchema`:
```typescript
facultyIds: z.array(z.number().int().positive()).optional(),
studyProgramIds: z.array(z.number().int().positive()).optional(),
// Empty array [] or undefined → berarti ALL (tidak ada filter)
```

In `bibliography.service.ts` `create()` and `update()`:

```typescript
// After inserting/updating the bibliography row:
if (data.facultyIds !== undefined) {
  await tx.delete(bibliographyFaculties).where(eq(bibliographyFaculties.bibliographyId, id));
  if (data.facultyIds.length > 0) {
    await tx.insert(bibliographyFaculties).values(
      data.facultyIds.map(fid => ({ bibliographyId: id, facultyId: fid }))
    );
  }
  // Jika empty array → hapus semua → artinya ALL
}

if (data.studyProgramIds !== undefined) {
  await tx.delete(bibliographyStudyPrograms).where(eq(bibliographyStudyPrograms.bibliographyId, id));
  if (data.studyProgramIds.length > 0) {
    await tx.insert(bibliographyStudyPrograms).values(
      data.studyProgramIds.map(spid => ({ bibliographyId: id, studyProgramId: spid }))
    );
  }
}
```

#### Bibliography List — Filter Logic

Add to `bibliographyQuerySchema`:
```typescript
facultyId: z.coerce.number().int().optional(),
studyProgramId: z.coerce.number().int().optional(),
```

In `bibliography.service.ts` `list()`:

```typescript
if (query.facultyId) {
  // Get bibliography IDs that have this faculty OR have no faculty assignment (ALL)
  const facultyBibIds = db.select({ bibId: bibliographyFaculties.bibliographyId })
    .from(bibliographyFaculties)
    .where(eq(bibliographyFaculties.facultyId, query.facultyId));

  // Get bibliography IDs with NO faculty assignment (ALL)
  const allBibIds = db.select({ id: bibliographies.id })
    .from(bibliographies)
    .where(
      and(
        isNull(bibliographies.deletedAt),
        notExists(
          db.select().from(bibliographyFaculties)
            .where(eq(bibliographyFaculties.bibliographyId, bibliographies.id))
        )
      )
    );

  // Combine: bibs that match the faculty OR have no faculty assignment
  conditions.push(
    or(
      inArray(bibliographies.id, facultyBibIds),
      inArray(bibliographies.id, allBibIds)
    )
  );
}

if (query.studyProgramId) {
  // Same logic: match specific OR no assignment (ALL)
  const spBibIds = ... (similar pattern)
  const allSpBibIds = ... (bibs with no study program assignment)
  conditions.push(or(inArray(...), inArray(...)));
}
```

Also include faculties and study programs in response (getById and list):
```typescript
// Add to `with`:
bibliographyFaculties: { with: { faculty: true } },
bibliographyStudyPrograms: { with: { studyProgram: { with: { faculty: true } } } },

// Map in response:
faculties: bib.bibliographyFaculties.map(bf => ({ id: bf.faculty.id, name: bf.faculty.name, code: bf.faculty.code })),
studyPrograms: bib.bibliographyStudyPrograms.map(bsp => ({
  id: bsp.studyProgram.id,
  name: bsp.studyProgram.name,
  code: bsp.studyProgram.code,
  faculty: { id: bsp.studyProgram.faculty.id, name: bsp.studyProgram.faculty.name }
})),
```

### Module Structure

```
src/modules/faculty/
  route/faculty.route.ts
  controller/faculty.controller.ts
  service/faculty.service.ts
  validation/faculty.validation.ts

src/modules/study-program/
  route/study-program.route.ts
  controller/study-program.controller.ts
  service/study-program.service.ts
  validation/study-program.validation.ts
```

### Implementation Checklist

#### Schema & Migration
- [ ] Add `faculties` table to `db/schema.ts`
- [ ] Add `studyPrograms` table to `db/schema.ts`
- [ ] Add `bibliographyFaculties` junction table
- [ ] Add `bibliographyStudyPrograms` junction table
- [ ] Add relations for all new tables
- [ ] Update existing `bibliographyRelations` to include new M:N relations
- [ ] Generate migration
- [ ] Apply migration

#### Faculties Module
- [ ] Create validation schemas
- [ ] Create service (CRUD + usage check before delete)
- [ ] Create controller
- [ ] Create route + JSDoc swagger
- [ ] Register in `routes/index.ts`
- [ ] Add to swagger.ts (schemas, paths, tags)

#### Study Programs Module
- [ ] Create validation schemas
- [ ] Create service (CRUD + facultyId filter on list + usage check)
- [ ] Create controller
- [ ] Create route + JSDoc swagger
- [ ] Register in `routes/index.ts`
- [ ] Add to swagger.ts

#### Bibliography Updates
- [ ] Add `facultyIds` and `studyProgramIds` to create/update schemas
- [ ] Add `facultyId` and `studyProgramId` to query schema
- [ ] Update `bibliography.service.ts`:
  - [ ] `create()`: sync junction tables after insert
  - [ ] `update()`: sync junction tables
  - [ ] `getById()`: include faculties + studyPrograms in response
  - [ ] `list()`: add ALL-aware filter logic for facultyId and studyProgramId
  - [ ] `list()`: include faculties + studyPrograms in response mapping

#### Seed Data
- [ ] Create seed file for UMC faculties and study programs
- [ ] Add seed command to package.json if not exists

---

## All Concept — Filter Logic Detail

The "ALL" concept means:
- Bibliography **without any** `bibliography_faculties` rows = visible in ALL faculty filters
- Bibliography **without any** `bibliography_study_programs` rows = visible in ALL study program filters
- Bibliography **with specific** assignments = only visible in those filters

SQL logic for faculty filter:
```sql
WHERE (
  -- Either has the selected faculty
  id IN (SELECT bibliography_id FROM bibliography_faculties WHERE faculty_id = ?)
  -- OR has no faculty assignment at all (= ALL)
  OR id IN (
    SELECT id FROM bibliographies b 
    WHERE NOT EXISTS (
      SELECT 1 FROM bibliography_faculties bf WHERE bf.bibliography_id = b.id
    )
    AND b.deleted_at IS NULL
  )
)
```

When **no filter** is applied (no `facultyId` or `studyProgramId` in query):
→ Return ALL bibliographies (no additional condition).

---

## Phase 1 Implementation Order

1. **Schema** — Add 4 new tables, generate migration, apply
2. **Faculties Module** — CRUD + route + swagger
3. **Study Programs Module** — CRUD + route + swagger
4. **Bibliography updates** — junction sync in create/update, ALL-aware filter, response mapping
5. **Duplicate Detection** — service method + controller + route + swagger
6. **Swagger docs** — Complete all new schemas, paths, tags
7. **Seed Data** — Fakultas & prodi UMC

---

## Migration Guide

```bash
cd library-be
npm run db:generate
npm run db:migrate
```

---

## Swagger Documentation

Each new route file must include JSDoc `@swagger` comments (see `category.route.ts` as reference). Then add to `swagger.ts`:

1. **Schemas** — Add `Faculty`, `StudyProgram`, `BibliographyFaculty`, `BibliographyStudyProgram`
2. **Paths** — Add all new endpoints
3. **Tags** — Add `"Faculties"`, `"Study Programs"` to tags array
4. **Update Bibliography schema** — Add `faculties[]` and `studyPrograms[]` fields
