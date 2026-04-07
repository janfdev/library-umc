// src/types/collection.ts
// Tipe-tipe yang berkaitan dengan koleksi buku (public catalog & reservasi)

// ==========================================
// COLLECTION
// ==========================================

export type CollectionType = "physical_book" | "ebook" | "journal" | "thesis";

export interface CollectionCategory {
  id: number;
  name: string;
  description?: string;
}

/** Struktur koleksi yang dikembalikan dari GET /api/collections */
export interface Collection {
  id: string;
  title: string;
  author: string;
  publisher: string;
  /** Tahun terbit — backend mengembalikan sebagai string (varchar) */
  publicationYear: string;
  isbn?: string;
  type: CollectionType;
  categoryId?: number;
  description?: string;
  /** URL gambar cover (Cloudinary) */
  image: string | null;
  /** Jumlah stok yang tersedia (hanya relevan untuk physical_book / agregat) */
  stock?: number;
  /** Daftar item fisik individual (buku yang memiliki barcode / ID unik) */
  items?: {
    id: string;
    status: string;
  }[];
  category?: CollectionCategory;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// RESERVATION
// ==========================================

export type ReservationStatus = "waiting" | "fulfilled" | "canceled";

/** Struktur reservasi dari GET /api/reservations/my */
export interface Reservation {
  id: string;
  memberId: string;
  collectionId: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// LOAN REQUEST
// ==========================================

export interface LoanRequest {
  id: string;
  status:
    | "pending"
    | "approved"
    | "extended"
    | "rejected"
    | "active"
    | "returned"
    | "overdue";
  itemId: string;
  memberId: string;
  loanDate?: string;
  dueDate?: string;
  returnDate?: string;
  approvedBy?: string;
  createdAt?: string;
  member?: Record<string, unknown>;
  item?: Record<string, unknown>;
}
