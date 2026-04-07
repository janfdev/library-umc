import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/utils/api-config";
import loanService from "@/services/loanService";
import reservationService, {
  type Reservation,
} from "@/services/reservationService";
import type { Collection, LibraryUser, LoanRequest } from "@/types";

export function useKatalogDetail(
  id: string | undefined,
  currentUser: LibraryUser | null,
  sessionLoading: boolean,
) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [userLoans, setUserLoans] = useState<LoanRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LoanRequest[]>([]);
  const [userReservation, setUserReservation] = useState<Reservation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [similarBooks, setSimilarBooks] = useState<Collection[]>([
    { id: "1", title: "Bulan", author: "Tere Liye", image: null, categoryId: 0, publicationYear: "2015", publisher: "Gramedia", type: "physical_book" } as unknown as Collection,
    { id: "2", title: "Matahari", author: "Tere Liye", image: null, categoryId: 0, publicationYear: "2016", publisher: "Gramedia", type: "physical_book" } as unknown as Collection,
    { id: "3", title: "Bintang", author: "Tere Liye", image: null, categoryId: 0, publicationYear: "2017", publisher: "Gramedia", type: "physical_book" } as unknown as Collection,
    { id: "4", title: "Ceros dan Batozar", author: "Tere Liye", image: null, categoryId: 0, publicationYear: "2018", publisher: "Gramedia", type: "physical_book" } as unknown as Collection,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const collectionResponse = await fetch(
          `${API_BASE_URL}/api/collections/${id}`,
        );
        if (!collectionResponse.ok)
          throw new Error(`HTTP error! status: ${collectionResponse.status}`);
        const collectionJson = await collectionResponse.json();

        if (collectionJson.success && collectionJson.data) {
          setCollection(collectionJson.data);

          const memberId = currentUser?.memberId;
          if (memberId) {
            try {
              const myLoans = await loanService.getMyLoanHistory();
              const loansForCollection = myLoans.filter(
                (loan: unknown) => {
                  const l = loan as { item?: { collection?: { id?: string } } };
                  return l?.item?.collection?.id === id;
                },
              ) as LoanRequest[];

              setPendingRequests(
                loansForCollection.filter((loan) => loan.status === "pending"),
              );

              setUserLoans(
                loansForCollection.filter(
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
                (r) => r.collectionId === id && r.status === "waiting",
              );
              setUserReservation(activeRes || null);
            } catch (err) {
              console.error("Error fetching reservation:", err);
            }
          }

          if (collectionJson.data.categoryId) {
            fetchSimilarBooks(collectionJson.data.categoryId);
          }
        } else {
          throw new Error(collectionJson.message || "Data tidak ditemukan");
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
          `${API_BASE_URL}/api/collections?categoryId=${categoryId}&limit=4`,
        );
        const data = await response.json();
        if (data.success) {
          setSimilarBooks(data.data);
        }
      } catch (error) {
        console.error("Error fetching similar books:", error);
      }
    };

    if (id && !sessionLoading) fetchData();
    window.scrollTo(0, 0);
  }, [id, sessionLoading, currentUser?.memberId]);

  return {
    collection,
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
