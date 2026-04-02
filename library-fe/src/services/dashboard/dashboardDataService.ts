import { API_BASE_URL } from "@/utils/api-config";

export interface DashboardStats {
  totalCollections: number;
  totalCategories: number;
  totalGuests: number;
  activeBorrowings: number;
  outstandingFines: number;
  totalFineRevenue: number;
}

export interface CollectionItem {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: string;
  type: string;
  category?: {
    id: string;
    name: string;
  };
  categoryId?: string;
  isbn?: string;
  stock: number;
  image: string | null;
}

export interface CategoryItem {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export interface GuestLogItem {
  id: string;
  name: string;
  email: string;
  identifier: string;
  faculty: string;
  major: string;
  visitDate: string;
}

const jsonOrThrow = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
};

export const dashboardDataService = {
  async getCollections(): Promise<CollectionItem[]> {
    const res = await fetch(`${API_BASE_URL}/api/collections`, {
      credentials: "include",
    });
    const data = await jsonOrThrow(res);
    return data.success && Array.isArray(data.data) ? data.data : [];
  },

  async getCategories(): Promise<CategoryItem[]> {
    const res = await fetch(`${API_BASE_URL}/api/categories`, {
      credentials: "include",
    });
    const data = await jsonOrThrow(res);
    return data.success && Array.isArray(data.data) ? data.data : [];
  },

  async getGuests(): Promise<GuestLogItem[]> {
    const res = await fetch(`${API_BASE_URL}/api/guests`, {
      credentials: "include",
    });
    const data = await jsonOrThrow(res);
    return data.success && Array.isArray(data.data) ? data.data : [];
  },

  async getStats(): Promise<DashboardStats> {
    const [
      collections,
      categories,
      guests,
      loansRes,
      unpaidFinesRes,
      paidFinesRes,
    ] = await Promise.all([
      this.getCollections(),
      this.getCategories(),
      this.getGuests().catch(() => []),
      fetch(`${API_BASE_URL}/api/loans?status=approved&limit=200`, {
        credentials: "include",
      }),
      fetch(`${API_BASE_URL}/api/fines?status=unpaid&limit=200`, {
        credentials: "include",
      }),
      fetch(`${API_BASE_URL}/api/fines?status=paid&limit=200`, {
        credentials: "include",
      }),
    ]);

    let activeBorrowings = 0;
    let outstandingFines = 0;
    let totalFineRevenue = 0;

    try {
      const loansData = await loansRes.json();
      if (loansData.success && Array.isArray(loansData.data)) {
        activeBorrowings = loansData.data.length;
      }
    } catch {
      activeBorrowings = 0;
    }

    try {
      const unpaidFinesData = await unpaidFinesRes.json();
      if (unpaidFinesData.success && Array.isArray(unpaidFinesData.data)) {
        outstandingFines = unpaidFinesData.data.reduce(
          (sum: number, fine: { amount: number }) =>
            sum + (Number(fine.amount) || 0),
          0,
        );
      }
    } catch {
      outstandingFines = 0;
    }

    try {
      const paidFinesData = await paidFinesRes.json();
      if (paidFinesData.success && Array.isArray(paidFinesData.data)) {
        totalFineRevenue = paidFinesData.data.reduce(
          (sum: number, fine: { amount: number }) =>
            sum + (Number(fine.amount) || 0),
          0,
        );
      }
    } catch {
      totalFineRevenue = 0;
    }

    return {
      totalCollections: collections.length,
      totalCategories: categories.length,
      totalGuests: guests.length,
      activeBorrowings,
      outstandingFines,
      totalFineRevenue,
    };
  },

  async deleteCollection(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/collections/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return jsonOrThrow(res);
  },

  async deleteCategory(id: number) {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return jsonOrThrow(res);
  },

  async deleteGuest(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/guests/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return jsonOrThrow(res);
  },
};
