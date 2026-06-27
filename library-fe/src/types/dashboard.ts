export type { Bibliography } from "./bibliography";

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
  totalBibliographies: number;
  totalCategories: number;
  totalGuests: number;
  activeBorrowings?: number;
  outstandingFines?: number;
  totalFineRevenue?: number;
}

export type ActiveMenu =
  | "dashboard"
  | "bibliographies"
  | "categories"
  | "guests"
  | "loans"
  | "reports";

export type LoanStatus = "all" | "pending" | "approved" | "active" | "returned";
