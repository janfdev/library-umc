import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/utils/api-config";

export interface DashboardStats {
  totalCollections: number;
  totalCategories: number;
  totalGuests: number;
  activeBorrowings: number;
  totalFines: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCollections: 0,
    totalCategories: 0,
    totalGuests: 0,
    activeBorrowings: 0,
    totalFines: 0,
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
          fetch(`${API_BASE_URL}/api/categories?limit=50`, { credentials: "include" }).catch(() => null),
          fetch(`${API_BASE_URL}/api/collections?limit=50`, { credentials: "include" }).catch(() => null),
        ]);
        
        const catData = catRes ? await catRes.json().catch(() => null) : null;
        const colData = colRes ? await colRes.json().catch(() => null) : null;
        const totalCategories = catData?.data?.length || 0;
        const totalCollections = colData?.data?.length || 0;

        // Fetch Guests
        let totalGuests = 0;
        try {
          const guestsRes = await fetch(`${API_BASE_URL}/api/guests`, { credentials: "include" });
          const guestsData = await guestsRes.json();
          if (guestsData.success && Array.isArray(guestsData.data)) {
            totalGuests = guestsData.data.length;
          }
        } catch { /* empty */ }

        // Fetch Loans & Fines
        let activeBorrowings = 0;
        let totalFines = 0;
        try {
          const [loansRes, finesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/loans?status=approved&limit=200`, { credentials: "include" }),
            fetch(`${API_BASE_URL}/api/fines?status=unpaid&limit=200`, { credentials: "include" }),
          ]);
          const [loansData, finesData] = await Promise.all([loansRes.json(), finesRes.json()]);

          if (loansData.success && Array.isArray(loansData.data)) {
            activeBorrowings = loansData.data.length;
          }
          if (finesData.success && Array.isArray(finesData.data)) {
            totalFines = finesData.data.reduce(
              (sum: number, fine: { amount: number }) => sum + (Number(fine.amount) || 0),
              0
            );
          }
        } catch { /* empty */ }

        if (isMounted) {
          setStats({
            totalCollections,
            totalCategories,
            totalGuests,
            activeBorrowings,
            totalFines,
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
    return () => { isMounted = false; };
  }, []);

  return { stats, loading, error };
}
