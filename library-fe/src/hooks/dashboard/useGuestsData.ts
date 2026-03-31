import { useCallback, useEffect, useState } from "react";
import {
  dashboardDataService,
  type GuestLogItem,
} from "@/services/dashboard/dashboardDataService";

export function useGuestsData(enabled: boolean) {
  const [guests, setGuests] = useState<GuestLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardDataService.getGuests();
      setGuests(data);
      setHasLoaded(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data pengunjung",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && !hasLoaded && !loading) {
      void fetchGuests();
    }
  }, [enabled, hasLoaded, loading, fetchGuests]);

  const refetch = useCallback(async () => {
    await fetchGuests();
  }, [fetchGuests]);

  return {
    guests,
    loading,
    error,
    hasLoaded,
    refetch,
  };
}
