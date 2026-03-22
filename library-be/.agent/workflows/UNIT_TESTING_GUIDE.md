---
description: Panduan Lengkap Unit Testing Backend Node.js
---

# Panduan Lengkap Pembuatan Code Testing di Backend `library-be`

Dokumen ini disusun sebagai pedoman utama bagi developer untuk mempelajari, memahami, dan memproduksi *Unit Test* sendiri ke depannya dengan menggunakan ekosistem **Vitest** dan **Supertest**. 

## 1. Menjawab Pertanyaan Fundamental: Apakah Hanya Controller yang Dites?

**Jawaban Singkat: TIDAK.** 

Controller memang bertugas sebagai *gerbang utama* (menerima Request, memvalidasi Zod, dan mengembalikan Response API). Namun, **Controller tidak boleh mengandung *business logic* (logika perhitungan bisnis)**. 

### Lapisan Mana Saja yang Harus Dites Berserta Fungsinya?
Berdasarkan *Clean Architecture*, berikut adalah hierarki apa saja yang perlu Anda test:

#### A. Controller Testing (Test Skenario API) ✅
*   **Fokus utama**: Mengecek validasi input (Zod), format HTTP Response Code (200, 201, 400, 404, 500), dan *Routing* parameter (seperti `req.params.id` atau `req.query`).
*   **Contoh Kasus yang sudah kita buat**: Memastikan API `POST /register` membuang (me-*reject*) Request dan mengembalikan Status 400 jika user mengirim `password` yang kurang dari aturan panjang karakter minimal.
*   **Karakteristik**: Pada tahapan ini, kita MENGHINDARI pemanggilan algoritma aslinya dengan cara **me-Mock (Merekayasa)** Service layer menggunakan `vi.spyOn()`, sehingga testing berjalan secepat kilat (hitungan milisekon) tanpa menyentuh *Database*.

#### B. Service Testing (Test Logika Bisnis) 🚀 (Prioritas Tertinggi)
*   **Fokus utama**: Di sinilah **jantung** algoritma aplikasi berada. Testing pada Service berfokus kepada kalkulasi data, pengecekan perizinan database, atau perubahan struktur *array/object*.
*   **Contoh Kasus**: Melakukan test terhadap `LoanService.requestLoan(memberId, itemId)`. Controller-nya sudah beres, tapi apakah Service ini benar-benar bisa menolak peminjaman jika Member tersebut sudah meminjam 3 buku (*limit terlampaui*)? Service Testing mengecek hal ini dengan tuntas!
*   **Karakteristik**: Pada Service Testing, kita melakukan *Mocking* terhadap fungsi Drizzle ORM (`db.select()`, `db.insert()`) agar aman dari memanipulasi Local Database sungguhan.

---

## 2. Tahapan Mendesain dan Menjalankan Testing

Dalam penulisan *test code*, kita selalu menggunakan patokan **Global AAA Pattern** (Arrange, Act, Assert).

### A. Pola AAA (*Arrange*, *Act*, *Assert*)
Setiap Anda menulis blok `it('harus...', async () => { ... })`, Anda membaginya menjadi 3 struktur perakitan:

1.  **Arrange (Siapkan)**: Siapkan *Mock Data* palsu, persiapkan parameter yang bakal dikirim, dan cegat (*Mock*) dependensi internal menggunakan Vitest (`vi.spyOn`).
2.  **Act (Aksi)**: Eksekusi fungsi atau akses URL Endpoint tersebut (menggunakan `request(app)` dari Supertest).
3.  **Assert (Buktikan)**: Gunakan parameter `expect()` untuk mencocokkan hasil akhir (Act) dengan prediksi Anda. Apakah datanya 100% cocok? Apakah status code-nya 404? 

### B. Membedah Kode Testing AuthController
Berikut ini implementasi asli dari pola AAA pada file `auth.controller.test.ts` kita.

```typescript
describe('POST /register', () => {
    
    it('harus merespon 201 dan return data jika berhasil lolos validasi', async () => {
      
      // 1. ARRANGE (SIAPKAN)
      const mockResult = {
        id: "mock-id-123",
        name: "Test User",
        email: "test@example.com",
        role: "member",
        hasCompletedProfile: false,
      };
      
      // Mencegat (Spy) AuthService agar jika dipanggil oleh Controller, 
      // dia tidak membongkar Database, melainkan menyodorkan mockResult secara instant.
      const registerSpy = vi.spyOn(AuthService.prototype, 'registerWithCredentials')
        .mockResolvedValueOnce(mockResult as any);

      // 2. ACT (AKSI)
      // Jalankan rekayasa HTTP POST menggunakan Supertest Payload palsu
      const response = await request(app).post('/register').send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      });

      // 3. ASSERT (BUKTIKAN)
      // Cek apakah balasan HTTP sesuai dengan kerangka API standard kita
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registrasi berhasil');
      expect(response.body.data).toEqual(mockResult); // Cek format Payload
      
      // Buktikan bahwa parameter Request kita benar-benar diumpankan tanpa cacat oleh Controller menuju ke Service.
      expect(registerSpy).toHaveBeenCalledTimes(1);
      expect(registerSpy).toHaveBeenCalledWith('Test User', 'test@example.com', 'password123');
    });

});
```

---

## 3. Perbedaan `vi.spyOn` vs `expect`

Ketika belajar, fokuslah pada syntax Vitest berikut ini:
*   `expect(A).toBe(B)`: Menguji kesamaan primitif. (Apakan A adalah B?). Misal 1 === 1.
*   `expect(A).toEqual(B)`: Menguji struktur *object* atau *array* secara mendalam (*Deep Equality*).
*   `vi.spyOn(TargetObject, 'methodName')`: Pemalsuan instan. Digunakan untuk memblokir sebuah fungsi dan merekayasa jawaban (`.mockResolvedValueOnce(...)`).

---

## 4. Rekomendasi Target Testing Selanjutnya

Saat ini, Anda telah menguasai konsep dasar melalui Module *Category* dan *Auth*. 
Jika Anda ingin melatih pembuatan testing (atau jika Anda ingin saya membuatkannya lagi), sangat direkomendasikan untuk menyerang bagian-bagian vital berikut:

*   **1. `LoanService` (Logika Peminjaman & Validasi Ketat)**
    *   *Kenapa?* Ini adalah fitur inti dari sistem Perpustakaan. 
    *   *Skenario Test*: Memastikan fungsi `requestLoan` menolak aksi jika *Item* (Buku) sedang dalam status tidak tersedia (*Not Available / Borrowed*). Pengujian kalkulasi kuota yang menolak member yang sedang me-request max. 3 buku.
*   **2. `FinesService` (Logika Keuangan & Denda)**
    *   *Kenapa?* Algoritma keuangan tidak boleh memiliki *bug*.
    *   *Skenario Test*: Memastikan denda tergenerasi secara presisi setelah *Loan* berlabel *Overdue*. Mencoba memvalidasi pembayaran agar status berubah menjadi `paid`.
*   **3. `ReservationService` (Logika Persaingan Koleksi)**
    *   *Kenapa?* Untuk memastikan sistem tidak mengizinkan pemesanan *(booking)* ketika kuota koleksi habis tanpa pengecualian.
*   **4. Middleware Auth (`src/middleware/auth.middleware.ts`)**
    *   *Kenapa?* Untuk membuktikan *Role-Based Access Control* (Misalnya, request tanpa JWT Token harus ditendang menggunakan Response Code `401 Unauthorized` atau Staff mencoba menembus Endpoint SuperAdmin ditendang ke `403 Forbidden`).

---

Dengan pedoman ini, Anda kini memiliki pondasi struktur Testing Level Enterprise. Selamat Bereksperimen!
