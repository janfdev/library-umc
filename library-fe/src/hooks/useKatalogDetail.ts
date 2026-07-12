import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/utils/api-config";
import loanService from "@/services/loanService";
import reservationService, {
  type Reservation,
} from "@/services/reservationService";
import type { Bibliography, LibraryUser, LoanRequest } from "@/types";

export function useKatalogDetail(
  id: string | undefined,
  currentUser: LibraryUser | null,
  sessionLoading: boolean,
) {
  const [bibliography, setBibliography] = useState<Bibliography | null>(null);
  const [userLoans, setUserLoans] = useState<LoanRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LoanRequest[]>([]);
  const [userReservation, setUserReservation] = useState<Reservation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [similarBooks, setSimilarBooks] = useState<Bibliography[]>([
    { id: "1", title: "Bulan", author: "Tere Liye", image: null, categoryId: 0, publicationYear: "2015", publisher: "Gramedia", type: "physical_book" } as unknown as Bibliography,
    { id: "2", title: "Matahari", author: "Tere Liye", image: null, categoryId: 0, publicationYear: "2016", publisher: "Gramedia", type: "physical_book" } as unknown as Bibliography,
    { id: "3", title: "Bintang", author: "Tere Liye", image: null, categoryId: 0, publicationYear: "2017", publisher: "Gramedia", type: "physical_book" } as unknown as Bibliography,
    { id: "4", title: "Ceros dan Batozar", author: "Tere Liye", image: null, categoryId: 0, publicationYear: "2018", publisher: "Gramedia", type: "physical_book" } as unknown as Bibliography,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const bibResponse = await fetch(
          `${API_BASE_URL}/api/bibliographies/${id}`,
        );
        if (!bibResponse.ok)
          throw new Error(`HTTP error! status: ${bibResponse.status}`);
        const bibJson = await bibResponse.json();

        if (bibJson.success && bibJson.data) {
          const item = bibJson.data;
          const mappedBib: Bibliography = {
            id: item.id,
            title: item.title,
            author: Array.isArray(item.authors)
              ? item.authors.map((a: any) => a.name).join(", ")
              : item.author || "",
            publisher: typeof item.publisher === "object"
              ? item.publisher?.name || ""
              : item.publisher || "",
            publicationYear: String(item.publishYear ?? ""),
            isbn: item.isbnIssn || item.isbn || "",
            type: item.type || "physical_book",
            categoryId: item.categoryId ?? item.category?.id,
            image: item.image || null,
            stock: item.stock ?? item.totalItems ?? 0,
            items: item.items || [],
            category: item.category,
            subjects: item.subjects || [],
          };
          setBibliography(mappedBib);

          const memberId = currentUser?.memberId;
          if (memberId) {
            try {
              const myLoans = await loanService.getMyLoanHistory();
              const loansForBib = myLoans.filter(
                (loan: unknown) => {
                  const l = loan as { item?: { bibliography?: { id?: string } } };
                  return l?.item?.bibliography?.id === id;
                },
              ) as LoanRequest[];

              setPendingRequests(
                loansForBib.filter((loan) => loan.status === "pending"),
              );

              setUserLoans(
                loansForBib.filter(
                  (loan) =>
                    loan.status === "approved" || loan.status === "extended",
                ),
              );
            } catch (err) {
              console.error("Error fetching member loans:", err);
              setPendingRequests([]);
              setUserLoans([]);
            }

            try {
              const reservations = await reservationService.getMyReservations();
              const activeRes = reservations.find(
                (r) => r.bibliographyId === id && r.status === "waiting",
              );
              setUserReservation(activeRes || null);
            } catch (err) {
              console.error("Error fetching reservation:", err);
            }
          }

          if (item.categoryId) {
            fetchSimilarBooks(item.categoryId);
          }
        } else {
          throw new Error(bibJson.message || "Data tidak ditemukan");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat detail buku",
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchSimilarBooks = async (categoryId: number) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/bibliographies?categoryId=${categoryId}&limit=4`,
        );
        const data = await response.json();
        if (data.success) {
          const rawItems = data.data?.items ?? (Array.isArray(data.data) ? data.data : []);
          const mapped = rawItems.map((item: any) => ({
            id: item.id,
            title: item.title,
            author: Array.isArray(item.authors)
              ? item.authors.map((a: any) => a.name).join(", ")
              : item.author || "",
            publisher: typeof item.publisher === "object"
              ? item.publisher?.name || ""
              : item.publisher || "",
            publicationYear: String(item.publishYear ?? ""),
            isbn: item.isbnIssn || item.isbn || "",
            type: item.type || "physical_book",
            categoryId: item.categoryId ?? item.category?.id,
            image: item.image || null,
            stock: item.stock ?? item.totalItems ?? 0,
            items: item.items || [],
            category: item.category,
            subjects: item.subjects || [],
          }));
          setSimilarBooks(mapped);
        }
      } catch (error) {
        console.error("Error fetching similar books:", error);
      }
    };

    if (id && !sessionLoading) fetchData();
    window.scrollTo(0, 0);
  }, [id, sessionLoading, currentUser?.memberId]);

  return {
    bibliography,
    userLoans,
    pendingRequests,
    userReservation,
    loading,
    error,
    similarBooks,
    setUserReservation,
    setPendingRequests,
  };
}
