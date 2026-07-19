# Product Requirements Document (PRD)

## Sistem Perpustakaan UMC — Tambahan Fitur

**Tanggal:** 12 Juli 2026
**Status:** Draft

---

## FR-11: Validasi Input & Error Feedback

| Item | Detail |
|------|--------|
| **Prioritas** | Tinggi |
| **Deskripsi** | Setiap input user (barcode, nama, form) menampilkan pesan error spesifik di field yang salah — tidak hanya toast generic. Backend sudah punya `sendValidationError` dgn field errors, frontend perlu menampilkan inline errors. |
| **Acceptance** | Form validation menampilkan error per-field; API error response konsisten `{success, message, data: {fieldErrors}}` |

## FR-12: Deteksi Duplikat Bibliografi

| Item | Detail |
|------|--------|
| **Prioritas** | Tinggi |
| **Deskripsi** | Sistem otomatis deteksi duplikat saat tambah/update bibliografi via: (1) ISBN exact match, (2) Judul + penulis fuzzy match. Muncul warning sebelum simpan. |
| **Backend** | `GET /api/bibliographies/check-duplicate?isbn=xxx&title=xxx&author=xxx` |
| **Frontend** | Warning modal "Buku dengan judul/ISBN serupa sudah ada. Tetap tambahkan?" |
| **Acceptance** | Duplikat terdeteksi; user bisa tetap lanjut atau batal |

## FR-13: OPAC Kiosk (Upgrade Katalog)

| Item | Detail |
|------|--------|
| **Prioritas** | Sedang |
| **Deskripsi** | Upgrade halaman `/katalog` yang sudah ada: tampilkan nomor klasifikasi, status "Ada di Rak"/"Dipinjam", jumlah eksemplar (X dari Y tersedia) di card hasil pencarian. Detail buku tampilkan info lebih prominent. |
| **Acceptance** | Pengunjung bisa tau stok & lokasi buku tanpa login |

## FR-14: Filter/Sortir Prodi & Fakultas

| Item | Detail |
|------|--------|
| **Prioritas** | Sedang |
| **Deskripsi** | Bibliografi bisa difilter berdasarkan program studi & fakultas. Relasi: 1 buku = 1 prodi. |
| **Data Model** | `faculties` (id, name, code), `study_programs` (id, faculty_id, name, code), tambah `study_program_id` di `bibliographies` |
| **Backend** | CRUD faculties + study_programs; filter `studyProgramId` di bibliography list |
| **Frontend** | Dropdown filter prodi di `/katalog`; field prodi di form bibliografi admin |
| **Acceptance** | Pustakawan bisa set prodi buku; katalog bisa filter per prodi |

---

## Rencana Implementasi

### Phase 1: Backend (Sekarang)
1. Migration: tabel faculties, study_programs, add study_program_id
2. CRUD module faculties + study_programs
3. Seed data fakultas & prodi UMC
4. Filter studyProgramId di bibliography list
5. Duplicate detection endpoint

### Phase 2: Frontend
1. Upgrade card & detail katalog (status, klasifikasi, eksemplar)
2. Filter prodi/fakultas di sidebar katalog
3. Field prodi di form bibliografi admin
4. Duplicate warning modal
5. Inline validation errors di form dashboard
