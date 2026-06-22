import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/utils/api-config";

export interface DashboardStats {
  totalCollections: number;
  totalCategories: number;
  totalGuests: number;
  activeBorrowings: number;
  outstandingFines: number;
  totalFineRevenue: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCollections: 0,
    totalCategories: 0,
    totalGuests: 0,
    activeBorrowings: 0,
    outstandingFines: 0,
    totalFineRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch Categories & Collections (Asli/Mock jika dibutuhkan)
        const [catRes, colRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories?limit=50`, {
            credentials: "include",
          }).catch(() => null),
          fetch(`${API_BASE_URL}/api/bibliographies?limit=50`, {
            credentials: "include",
          }).catch(() => null),
        ]);

        const catData = catRes ? await catRes.json().catch(() => null) : null;
        const colData = colRes ? await colRes.json().catch(() => null) : null;
        const totalCategories = catData?.data?.length || 0;
        const totalCollections = colData?.data?.length || 0;

        // Fetch Guests
        let totalGuests = 0;
        try {
          const guestsRes = await fetch(`${API_BASE_URL}/api/guests`, {
            credentials: "include",
          });
          const guestsData = await guestsRes.json();
          if (guestsData.success && Array.isArray(guestsData.data)) {
            totalGuests = guestsData.data.length;
          }
        } catch {
          /* empty */
        }

        // Fetch Loans & Fines
        let activeBorrowings = 0;
        let outstandingFines = 0;
        let totalFineRevenue = 0;
        try {
          const [loansRes, unpaidFinesRes, paidFinesRes] = await Promise.all([
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
          const [loansData, unpaidFinesData, paidFinesData] = await Promise.all(
            [loansRes.json(), unpaidFinesRes.json(), paidFinesRes.json()],
          );

          if (loansData.success && Array.isArray(loansData.data)) {
            activeBorrowings = loansData.data.length;
          }
          if (unpaidFinesData.success && Array.isArray(unpaidFinesData.data)) {
            outstandingFines = unpaidFinesData.data.reduce(
              (sum: number, fine: { amount: number }) =>
                sum + (Number(fine.amount) || 0),
              0,
            );
          }
          if (paidFinesData.success && Array.isArray(paidFinesData.data)) {
            totalFineRevenue = paidFinesData.data.reduce(
              (sum: number, fine: { amount: number }) =>
                sum + (Number(fine.amount) || 0),
              0,
            );
          }
        } catch {
          /* empty */
        }

        if (isMounted) {
          setStats({
            totalCollections,
            totalCategories,
            totalGuests,
            activeBorrowings,
            outstandingFines,
            totalFineRevenue,
          });
          setError(null);
        }
      } catch {
        if (isMounted) setError("Gagal mengambil data statistik.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return { stats, loading, error };
}
