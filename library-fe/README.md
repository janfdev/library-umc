# 📚 MUCILIB — Library Frontend (library-fe)

![Project Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

Frontend aplikasi **MUCILIB** — Sistem Perpustakaan Digital Universitas Muhammadiyah Cirebon. Dibangun dengan React 19 + TypeScript + Vite, dengan autentikasi menggunakan Better Auth (Email & Google SSO).

---

## 🛠 Tech Stack

| Teknologi            | Kegunaan                         |
| -------------------- | -------------------------------- |
| React 19             | UI Framework                     |
| TypeScript           | Type Safety                      |
| Vite                 | Build Tool & Dev Server          |
| Tailwind CSS v4      | Styling                          |
| Better Auth (Client) | Autentikasi (Email + Google SSO) |
| React Router v7      | Client-side Routing              |
| Lucide React         | Icon Library                     |

---

## 🚀 Instalasi & Menjalankan

### Prerequisites

- Node.js v18+
- Backend (`library-be`) sudah berjalan (default: `http://localhost:4000`)

### 1. Clone & Install

```bash
git clone https://github.com/MUCILIB/library-umc.git
cd library-fe
npm install
```

### 2. Konfigurasi Environment

Buat file `.env` di root folder `library-fe`:

```env
VITE_BETTER_AUTH_URL=http://localhost:4000
VITE_API_URL=http://localhost:4000
VITE_BASE_URL=http://localhost:5173
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 3. Jalankan Development Server

```bash
npm run dev
# → http://localhost:5173
```

---

## 📄 License

[MIT License](LICENSE)
