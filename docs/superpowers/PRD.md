# Product Requirements Document (PRD)

## Sistem Perpustakaan UMC — Tambahan Fitur

**Tanggal:** 12 Juli 2026 (Revisi: 19 Juli 2026)
**Status:** Final

---

## FR-11: Validasi Input & Error Feedback

| Item | Detail |
|------|--------|
| **Prioritas** | Tinggi |
| **Deskripsi** | Setiap input user (barcode, nama, form) menampilkan pesan error spesifik di field yang salah — tidak hanya toast generic. Backend sudah punya `sendValidationError` dgn field errors, frontend perlu menampilkan inline errors. |
| **Acceptance** | Form validation menampilkan error per-field; API error response konsisten `{success, message, data: {fieldErrors}}` |
| **Backend** | ✅ Sudah siap, `sendValidationError` di `api-utils.ts` |

## FR-12: Deteksi Duplikat Bibliografi + Suggestion

| Item | Detail |
|------|--------|
| **Prioritas** | Tinggi |
| **Deskripsi** | Saat input form bibliografi (create), sistem mendeteksi duplikat secara live via ISBN exact match + title/author fuzzy match. Jika ditemukan, tampilkan suggestion card — user bisa klik untuk redirect ke bibliografi yang sudah ada dan langsung add items (perbanyak stok). **Tujuan: cegah duplikasi data, bukan sekedar warning.** |
| **Backend** | `GET /api/bibliographies/check-duplicate?isbn=xxx&title=xxx&author=xxx` — public, mengembalikan `{ hasExactMatch, duplicates[] }` |
| **Frontend** | Suggestion card/list di form. Klik salah satu → redirect ke halaman bibliografi tersebut → user tinggal add items. Jika tidak ada duplikat → proceed create normal. |
| **Acceptance** | Duplikat terdeteksi otomatis; user bisa langsung navigasi ke existing record untuk add items; tidak ada duplikat data baru |

## FR-13: OPAC Kiosk (Upgrade Katalog)

| Item | Detail |
|------|--------|
| **Prioritas** | Sedang |
| **Deskripsi** | Upgrade halaman `/katalog` yang sudah ada: tampilkan nomor klasifikasi, status "Ada di Rak"/"Dipinjam", jumlah eksemplar (X dari Y tersedia) di card hasil pencarian. Detail buku tampilkan info lebih prominent. |
| **Acceptance** | Pengunjung bisa tau stok & lokasi buku tanpa login |
| **Backend** | ✅ Sudah siap, `list` dan `getById` sudah return `totalItems` + `availableItems` |

## FR-14: Filter/Sortir Prodi & Fakultas (M:N + ALL)

| Item | Detail |
|------|--------|
| **Prioritas** | Sedang |
| **Deskripsi** | Bibliografi bisa difilter berdasarkan fakultas & program studi. **Relasi M:N**: 1 buku bisa terkait dengan banyak fakultas dan banyak prodi. **Konsep ALL**: buku yang tidak di-assign ke fakultas/prodi manapun akan muncul di semua filter (cocok untuk buku umum seperti Metodologi Penelitian). |
| **Data Model** | `faculties` (id, name, code), `study_programs` (id, faculty_id, name, code), junction `bibliography_faculties` (bibliography_id, faculty_id), junction `bibliography_study_programs` (bibliography_id, study_program_id). Tidak ada kolom baru di `bibliographies`. |
| **Filter Logic** | `WHERE bibliography HAS faculty_id=X OR bibliography HAS NO faculties (=ALL)` |
| **Backend** | CRUD faculties + study_programs; filter `facultyId` & `studyProgramId` di bibliography list dengan ALL-aware logic; sync junction di create/update bibliography |
| **Frontend** | Multi-select dropdown filter di `/katalog`; multi-select field di form bibliografi admin; checkbox "Semua Fakultas"/"Semua Prodi" (kosongkan = ALL) |
| **Acceptance** | Pustakawan bisa assign banyak fakultas & prodi ke 1 buku; katalog bisa filter per fakultas & prodi; buku umum muncul di semua filter |

---

## Rencana Implementasi

### Phase 1: Backend (Sekarang)
1. Migration: tabel faculties, study_programs, bibliography_faculties, bibliography_study_programs
2. CRUD module faculties + study_programs
3. Update bibliography: sync junction di create/update, ALL-aware filter
4. Duplicate detection endpoint
5. Seed data fakultas & prodi UMC

### Phase 2: Frontend
1. Upgrade card & detail katalog (status, klasifikasi, eksemplar)
2. Filter prodi/fakultas di sidebar katalog (multi-select)
3. Multi-select field prodi & fakultas di form bibliografi admin
4. Duplicate suggestion card di form create bibliografi
5. Inline validation errors di form dashboard
