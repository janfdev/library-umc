import { useCallback, useEffect, useState } from "react";
import {
  dashboardDataService,
  type CollectionItem,
} from "@/services/dashboard/dashboardDataService";

export function useCollectionsData(enabled: boolean) {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardDataService.getCollections();
      setCollections(data);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat koleksi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && !hasLoaded && !loading) {
      void fetchCollections();
    }
  }, [enabled, hasLoaded, loading, fetchCollections]);

  const refetch = useCallback(async () => {
    await fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    loading,
    error,
    hasLoaded,
    refetch,
  };
}
