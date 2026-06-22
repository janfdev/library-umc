import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../utils/api-config";
import type { Collection, Reservation } from "../types";

export type { Collection, Reservation } from "../types";

// ==========================================
// INTERNAL TYPES (milik hook ini saja)
// ==========================================

interface CurrentUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

interface UseBookListReturn {
  collections: Collection[];
  userReservations: Reservation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ==========================================
// HOOK
// ==========================================

export function useBookList(
  currentUser?: CurrentUser | null
): UseBookListReturn {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchCollections = async () => {
    const response = await fetch(`${apiUrl}/api/bibliographies`);

    if (!response.ok) {
      let apiMessage = "";
      try {
        const errJson = await response.json();
        apiMessage =
          typeof errJson?.message === "string" ? errJson.message : "";
      } catch {
        apiMessage = "";
      }

      throw new Error(
        apiMessage
          ? `Gagal mengambil koleksi: ${apiMessage} (HTTP ${response.status})`
          : `Gagal mengambil koleksi (HTTP ${response.status})`
      );
    }

    const json = await response.json();

    if (!json.success || !Array.isArray(json.data)) {
      throw new Error("Respons API tidak valid");
    }

    setCollections(json.data);
  };

  const fetchMyReservations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reservations/my`, {
        credentials: "include" // kirim cookie session better-auth
      });

      if (!response.ok) return;

      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        setUserReservations(json.data);
      }
    } catch {
      // Reservasi gagal diambil, tidak perlu crash — bisa jadi belum login
      console.warn("[useBookList] Gagal mengambil reservasi user");
    }
  };

  // Gunakan primitive (userId) sebagai dep bukan object, supaya tidak trigger loop
  const userId = currentUser?.id;

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await fetchCollections();

      if (userId) {
        await fetchMyReservations();
      } else {
        setUserReservations([]);
      }
    } catch (err) {
      console.error("[useBookList] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  }, [userId]); // userId adalah string primitive, aman sebagai dependency

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    collections,
    userReservations,
    loading,
    error,
    refetch: fetchAll
  };
}
