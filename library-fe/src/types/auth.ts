// src/types/auth.ts
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: "student" | "lecturer" | "super_admin" | "staff";
}

/**
 * User yang digunakan oleh komponen frontend:
 * bentuk sederhana dari session better-auth + field khusus perpustakaan.
 * Gunakan ini saat passing `currentUser` sebagai prop komponen.
 */
export interface LibraryUser {
  id: string;
  /** ID member di tabel members (bisa beda dengan auth id) */
  memberId?: string;
  name: string;
  email: string;
  role: "admin" | "mahasiswa";
  /** NIM mahasiswa jika ada */
  nim?: string;
}

export interface AuthSession {
  user: AuthUser;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}
