# Analisis Proyek MUCILIB - Perpustakaan UMC

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Express 5 + TypeScript + Drizzle ORM (PostgreSQL) |
| **Frontend** | React + Vite + Tailwind CSS + shadcn/ui |
| **Auth** | Better Auth (email/password + Google OAuth) |
| **File Upload** | Multer + Cloudinary |
| **PDF/Excel** | PDFKit + ExcelJS |
| **Email** | Nodemailer + Resend |
| **Rate Limiting** | express-rate-limit |
| **API Docs** | Swagger (swagger-jsdoc + swagger-ui-express) |
| **QR Code** | qrcode library |
| **Testing** | Vitest + Supertest |

---

## Struktur Folder

### Backend (`library-be/`)

```
library-be/
├── src/
│   ├── config/              # Mailer, Swagger config
│   ├── cron/                # Fine scheduler (daily 00:01 WIB)
│   ├── db/
│   │   ├── schema.ts        # Semua database schema (555 lines)
│   │   ├── seed.ts          # Seed data
│   │   └── index.ts         # DB connection
│   ├── exceptions/          # Custom error classes
│   ├── lib/                 # Better Auth config
│   ├── middlewares/         # Auth, error handler, rate limiter
│   ├── modules/             # Feature-based modules
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── category/
│   │   ├── collection/
│   │   ├── fines/
│   │   ├── guest/
│   │   ├── item/
│   │   ├── loan/
│   │   ├── location/
│   │   ├── member/
│   │   ├── notification/
│   │   ├── recommendation/
│   │   ├── report/
│   │   ├── reservation/
│   │   └── shared/          # Email service + templates
│   ├── routes/              # Central route aggregator
│   ├── types/               # Express type augmentation
│   └── utils/               # API helpers, auth utils, upload
└── Dokumentasin_API_Bruno_MUCILIB_BE/  # Bruno API docs
```

### Frontend (`library-fe/`)

```
library-fe/
├── src/
│   ├── assets/              # Static images
│   ├── components/
│   │   ├── dashboard/       # Admin dashboard sections
│   │   │   ├── collections/
│   │   │   ├── AddCollectionModal.tsx
│   │   │   ├── CollectionForm.tsx
│   │   │   ├── CollectionsSection.tsx
│   │   │   ├── LoansSection.tsx
│   │   │   ├── FinesSection.tsx
│   │   │   ├── CategoriesSection.tsx
│   │   │   ├── UsersSection.tsx
│   │   │   └── ...
│   │   ├── ui/              # shadcn/ui components
│   │   ├── BookList.tsx
│   │   ├── LoanRequestForm.tsx
│   │   ├── MemberCard.tsx
│   │   └── ...
│   ├── hooks/               # Custom hooks (React Query)
│   ├── pages/
│   │   ├── dashboard/
│   │   │   └── SuperAdminDashboard.tsx
│   │   ├── Home.tsx
│   │   ├── Katalog.tsx
│   │   ├── KatalogDetail.tsx
│   │   ├── MyLoansPage.tsx
│   │   ├── Profile.tsx
│   │   ├── LoginPage.tsx
│   │   ├── Register.tsx
│   │   └── ...
│   ├── routes/              # Route config
│   ├── services/            # API service files
│   ├── types/               # TypeScript types
│   └── utils/               # Helpers
```

---

## Database Schema

### Enums

| Enum | Values |
|------|--------|
| `collection_type` | physical_book, ebook, journal, thesis |
| `content_type` | text, pdf, url |
| `item_status` | available, loaned, damaged, lost |
| `loans_status` | pending, approved, returned, extended, rejected |
| `reservations_status` | waiting, fulfilled, canceled |
| `fines_status` | paid, unpaid |
| `logs_status` | create, update, delete, approve, blacklist, failed_login, rate_limited |
| `logs_entity` | loan, item, fine, Users, category, collection, reservation, auth |
| `recommendation_status` | pending, approved, rejected |
| `member_type` | student, lecturer, staff, super_admin, external |
| `member_card_status` | not_requested, pending, active, rejected, expired |
| `return_request_status` | pending, approved |

### Collections (Buku) - `schema.ts:231-246`

```typescript
collections = pgTable("collections", {
  id:              uuid("id").primaryKey().defaultRandom(),
  isbn:            varchar("isbn", { length: 255 }),
  title:           varchar("title", { length: 255 }),
  author:          varchar("author", { length: 255 }),
  publisher:       varchar("publisher", { length: 150 }),
  publicationYear: varchar("publication_year", { length: 100 }),
  type:            collectionTypeEnum("type"),
  categoryId:      integer("category_id").references(() => categories.id),
  description:     text("description"),
  image:           text("image"),
  stock:           integer("stock").notNull().default(0),
  createdAt:       timestamp("created_at").defaultNow(),
  updatedAt:       timestamp("updated_at").defaultNow(),
  deletedAt:       timestamp("deleted_at")
});
```

**Field Stock:** Merupakan jumlah item yang tersedia (status = "available"). Di-sync otomatis oleh fungsi `syncCollectionAvailableStock()`.

### Items (Salinan Fisik) - `schema.ts:282-307`

```typescript
items = pgTable("items", {
  id:           uuid("id").primaryKey().defaultRandom(),
  collectionId: uuid("collection_id").notNull().references(() => collections.id),
  barcode:      varchar("barcode", { length: 50 }).unique(),
  uniqueCode:   varchar("unique_code", { length: 30 }).unique(),
  status:       itemStatusEnum("status").notNull().default("available"),
  locationId:   integer("location_id").notNull().references(() => locations.id),
  createdAt:    timestamp("created_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow(),
  deletedAt:    timestamp("deleted_at")
});
```

**Relasi:** 1 Collection → Many Items (salinan fisik)

### Categories - `schema.ts:92-97`

```typescript
categories = pgTable("categories", {
  id:          integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name:        varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  deletedAt:   timestamp("deleted_at")
});
```

### Locations - `schema.ts:99-105`

```typescript
locations = pgTable("locations", {
  id:    integer("id").primaryKey().generatedAlwaysAsIdentity(),
  room:  varchar("room", { length: 200 }).notNull(),
  rack:  varchar("rack", { length: 200 }).notNull(),
  shelf: varchar("shelf", { length: 200 }).notNull(),
  deletedAt: timestamp("deleted_at")
});
```

### Members - `schema.ts:193-225`

```typescript
members = pgTable("members", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  userId:             text("user_id").notNull().unique(),
  memberType:         memberType("member_type").notNull(),
  nimNidn:            varchar("nim_nidn", { length: 255 }),
  faculty:            varchar("faculty", { length: 255 }),
  originRegion:       varchar("origin_region", { length: 255 }),
  institution:        varchar("institution", { length: 255 }),
  phone:              varchar("phone", { length: 100 }),
  cardStatus:         memberCardStatusEnum("card_status").notNull().default("not_requested"),
  // ... field lainnya
});
```

### Loans (Peminjaman)

```typescript
loans = pgTable("loans", {
  id:           uuid("id").primaryKey().defaultRandom(),
  itemId:       uuid("item_id").notNull().references(() => items.id),
  memberId:     uuid("member_id").notNull().references(() => members.id),
  loanDate:     timestamp("loan_date").defaultNow(),
  dueDate:      timestamp("due_date").notNull(),
  returnDate:   timestamp("return_date"),
  status:       loansStatusEnum("status").notNull().default("pending"),
  notes:        text("notes"),
  createdAt:    timestamp("created_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow()
});
```

### Reservations (Pemesanan/Antrian)

```typescript
reservations = pgTable("reservations", {
  id:           uuid("id").primaryKey().defaultRandom(),
  collectionId: uuid("collection_id").notNull().references(() => collections.id),
  memberId:     uuid("member_id").notNull().references(() => members.id),
  status:       reservationsStatusEnum("status").notNull().default("waiting"),
  reservedAt:   timestamp("reserved_at").defaultNow(),
  fulfilledAt:  timestamp("fulfilled_at"),
  canceledAt:   timestamp("canceled_at"),
  createdAt:    timestamp("created_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow()
});
```

### Fines (Denda)

```typescript
fines = pgTable("fines", {
  id:           uuid("id").primaryKey().defaultRandom(),
  loanId:       uuid("loan_id").notNull().references(() => loans.id),
  memberId:     uuid("member_id").notNull().references(() => members.id),
  amount:       integer("amount").notNull(),
  status:       finesStatusEnum("status").notNull().default("unpaid"),
  paidAt:       timestamp("paid_at"),
  createdAt:    timestamp("created_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow()
});
```

---

## Fitur Utama

| Modul | Deskripsi | Endpoint |
|-------|-----------|----------|
| **Auth** | Login, register, logout, Google OAuth, forgot password | `/api/auth/*` |
| **Collections** | CRUD koleksi buku | `/api/collections` |
| **Items** | CRUD salinan fisik buku | `/api/items` |
| **Loans** | Peminjaman, pengembalian, perpanjangan | `/api/loans` |
| **Reservations** | Pemesanan antrian buku | `/api/reservations` |
| **Fines** | Denda keterlambatan (auto cron) | `/api/fines` |
| **Members** | Profil anggota, kartu member | `/api/members` |
| **Categories** | Kategori buku | `/api/categories` |
| **Locations** | Lokasi fisik (ruang, rak, lemari) | `/api/locations` |
| **Audit Logs** | Log aktivitas sistem | `/api/audit` |
| **Guests** | Absensi pengunjung | `/api/guests` |
| **Recommendations** | Rekomendasi buku dari dosen | `/api/recommendations` |
| **Reports** | Laporan (PDF/Excel) | `/api/reports` |
| **Notifications** | Notifikasi email | `/api/notifications` |

---

## Pages (Frontend)

| Route | Halaman | Akses | Fungsi |
|-------|---------|-------|--------|
| `/` | Home | Public | Landing page dengan hero, search, shortcut, buku terbaru |
| `/katalog` | Katalog | Public | Browse buku dengan filter (judul, penulis, ISBN, ketersediaan, tahun) |
| `/katalog/:id` | KatalogDetail | Public | Detail buku + pinjam/reservasi |
| `/profile` | Profile | Member | Profil, pinjaman aktif, riwayat, denda, kartu member |
| `/my-loans` | MyLoans | Member | Pinjaman saya + perpanjangan |
| `/absensi` | Absensi | Public | Absensi pengunjung |
| `/e-resource` | E-Resource | Public | Sumber daya digital |
| `/tentang` | Tentang | Public | Informasi perpustakaan |
| `/login` | Login | Public | Login email/password + Google SSO |
| `/register` | Register | Public | Registrasi akun |
| `/forgot-password` | ForgotPassword | Public | Reset password |
| `/reset-password` | ResetPassword | Public | Form reset password |
| `/dashboard/super-admin` | SuperAdminDashboard | Admin | Dashboard admin lengkap |

---

## Alur Penambahan Buku (Add Collection + Items)

### Langkah 1: Tambah Collection (Koleksi)

1. Admin akses `/dashboard/super-admin` → tab **Collections**
2. Klik tombol **"Add Collection"** → modal `AddCollectionModal` muncul
3. Form diisi:
   - ISBN
   - Judul
   - Penulis
   - Penerbit
   - Tahun Terbit
   - Tipe (physical_book, ebook, journal, thesis)
   - Kategori (dropdown)
   - Deskripsi
   - Gambar (upload ke Cloudinary)
4. Submit → `POST /api/collections` dengan multipart/form-data
5. Response: collection baru dengan `stock = 0`

### Langkah 2: Tambah Items (Salinan Fisik)

1. Admin klik collection → detail view
2. Tambah items satu per satu atau bulk:
   - Barcode (unik)
   - Kode unik
   - Lokasi (ruang, rak, lemari)
3. Submit → `POST /api/items`
4. Stock collection otomatis di-sync (count items available)

### Alur Stock

```
Collection.stock = COUNT(items WHERE status = 'available' AND deletedAt IS NULL)
```

Stock berubah saat:
- Item ditambah → stock +1
- Item dipinjam (status: loaned) → stock -1
- Item dikembalikan (status: available) → stock +1
- Item dihapus/hilang/rusak → stock -1

---

## Alur Peminjaman (Loan Flow)

```
Member Browse Katalog
        ↓
    Pilih Buku
        ↓
   Klik "Pinjam"
        ↓
  Form Pilih Tanggal
  (auto due date +3 hari)
        ↓
    Submit Loan
        ↓
  Status: PENDING
        ↓
  Admin Review
    ↙        ↘
Approve    Reject
    ↓
Status: APPROVED
    ↓
  Member Pinjam
    ↓
  Member Return
    ↓
Status: RETURNED
    ↓
Jika Terlambat → Auto Cron Hitung Denda
```

---

## Statistik Dashboard Admin

| Stat | Sumber |
|------|--------|
| Total Koleksi | COUNT(collections) |
| Total Anggota | COUNT(members) |
| Peminjaman Aktif | COUNT(loans WHERE status = 'approved') |
| Denda Belum Dibayar | SUM(fines WHERE status = 'unpaid') |
| Buku Tersedia | SUM(collections.stock) |
| Pengunjung Hari Ini | COUNT(guests WHERE date = today) |

---

## Fitur yang Belum Ada / Potensi Refactor

1. **Tidak ada schema untuk stok total** - hanya stok tersedia (available)
2. **Tidak ada tracking siapa yang menambah item** - tidak ada audit log spesifik untuk item creation
3. **Tidak ada bulk import buku** - harus satu per satu
4. **Tidak ada QR code untuk collection** - hanya untuk loans
5. **Tidak ada fitur wishlist** - hanya rekomendasi dari dosen
6. **Tidak ada fitur review/rating buku**
7. **Tidak ada fitur perpanjangan otomatis**
8. **Tidak ada notifikasi WhatsApp/SMS** - hanya email

---

## Kesimpulan

Proyek MUCILIB adalah sistem perpustakaan lengkap dengan:
- **15 modul** backend
- **16 halaman** frontend
- **12+ schema** database
- Fitur CRUD lengkap untuk koleksi, items, peminjaman, denda
- Dashboard admin dengan statistik real-time
- Sistem auth dengan role-based access control

**Siap untuk refactor dan penambahan schema baru.**
