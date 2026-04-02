// src/types/dashboard.ts
// Shared TypeScript interfaces for the dashboard module

export interface Collection {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: string;
  isbn?: string;
  type: "physical_book" | "ebook" | "journal" | "thesis";
  description?: string;
  image: string | null;
  category: {
    id: number;
    name: string;
  };
  categoryId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export interface GuestLog {
  id: string;
  name: string;
  email: string;
  identifier: string;
  institution?: string;
  faculty: string;
  major: string;
  purpose?: string;
  visitDate: string;
  createdAt?: string;
}

export interface CampusUser {
  full_name: string;
  nim: string;
  email: string;
  faculty: string;
  prodi: string;
}

export interface Loan {
  id: string;
  bookTitle: string;
  bookId: string;
  borrowerName: string;
  borrowerNim: string;
  borrowerId: string;
  startDate: string;
  endDate: string;
  purpose: string;
  notes?: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "active"
    | "returned"
    | "overdue";
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectReason?: string;
}

export interface DashboardStats {
  totalCollections: number;
  totalCategories: number;
  totalGuests: number;
  activeBorrowings?: number;
  outstandingFines?: number;
  totalFineRevenue?: number;
}

export type ActiveMenu =
  | "dashboard"
  | "collections"
  | "categories"
  | "guests"
  | "loans"
  | "reports";

export type LoanStatus = "all" | "pending" | "approved" | "active" | "returned";
