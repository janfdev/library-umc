# Library Management System

Sistem manajemen perpustakaan modern dengan arsitektur Monorepo (Backend + Frontend).

## 📚 Tech Stack

### Backend (`library-be`)

- **Runtime:** Node.js
- **Framework:** Express.js v5
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Auth:** Better Auth
- **Validation:** Zod
- **Storage:** Cloudinary
- **Others:** Multer (File Upload), PDFKit (Reporting), Nodemailer (Emailing)

### Frontend (`library-fe`)

- **Framework:** React + TypeScript (React Router)
- **Build Tool:** Vite
- **Styling:** TailwindCSS, Radix UI, Framer Motion
- **Auth Client:** Better Auth React

### DevOps

- **Containerization:** Docker + Docker Compose

---

## 🚀 Quick Start

### Prerequisites

- Node.js v20+
- npm (Node Package Manager)
- Docker Desktop (opsional, untuk menjalankan via container)

### 1. Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd library-umc

# Install Dependencies Backend
cd library-be
npm install

# Install Dependencies Frontend
cd ../library-fe
npm install
```

### 2. Setup Environment Variables

```bash
# Backend
cd library-be
cp .env.example .env
# Edit .env dengan kredensial PostgreSQL, Cloudinary, Better Auth, dll.

# Frontend
cd ../library-fe
cp .env.example .env
# Edit .env dan sesuaikan variabel untuk Vite (misal: VITE_API_URL).
```

### 3. Run Development (Tanpa Docker)

```bash
# Terminal 1 - Backend
cd library-be
npm run dev
# Server berjalan di http://localhost:3000

# Terminal 2 - Frontend
cd library-fe
npm run dev
# Server berjalan di http://localhost:5173
```

### 4. Run Development (Dengan Docker)

```bash
# Di root folder
docker-compose up --build
```

Akses:

- Frontend: http://localhost (Nginx)
- Backend: http://localhost:3000
- Adminer (DB GUI): http://localhost:8080

---

## 📁 Project Structure

```
library-umc/
├── library-be/              # REST API Backend (Express + TypeScript)
│   ├── src/                 # Source code (routes, controllers, models, dll)
│   ├── drizzle/             # File migrasi Drizzle ORM
│   ├── package.json
│   └── Dockerfile
│
├── library-fe/              # Antarmuka Modern Frontend (React + Vite)
│   ├── src/                 # Source code (components, pages, lib, dll)
│   ├── package.json
│   └── Dockerfile
│
├── library-qa/              # Quality Assurance (Testing & Automation)
│
└── docker-compose.yml       # Konfigurasi container untuk Backend, Frontend & DB
```

---

## 🤝 Team Workflow

### Backend Developer

Bekerja pada direktori `library-be/`. Fokus pengembangan API endpoints, integrasi Drizzle ORM dengan PostgreSQL, manajemen file di Cloudinary, laporan dengan PDFKit, serta autentikasi (Better Auth). Gunakan `npm run dev` untuk live-reload (otomatis menjalankan `tsx`). Dokumentasi dan testing endpoint juga tersedia di folder terpisah.

### Frontend Developer

Bekerja pada direktori `library-fe/`. Fokus pada antarmuka menggunakan React, styling TailwindCSS terintegrasi komponen berbasis Radix UI, dan interaksi yang dihiasi Framer Motion. Gunakan `npm run dev` untuk server Vite secara lokal.

---

## 🔐 Security

- File `.env` tidak di-commit ke repository.
- Konfigurasi CORS hanya menerima traffic dari frontend terpercaya.
- Validasi strict seluruh request (Body, Query, Params) menggunakan Zod.
- Manajemen hak akses pengguna (Role/Permission) dan sesi dengan Better Auth.
