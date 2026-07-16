import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { bibliographyApi, type Bibliography } from "@/api/client";
import { generateColorFromSeed } from "@/utils/format";

export default function HomeBookList() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Bibliography[]>([]);
  const [activeTab, setActiveTab] = useState<"physical_book" | "ebook">("physical_book");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPopularBooks() {
      try {
        setLoading(true);
        // Fetch more popular books so we have enough to filter between physical and ebook
        const response = await bibliographyApi.list({ isPopular: "true", limit: 30 });
        setBooks(response.data.items || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }
    fetchPopularBooks();
  }, []);

  const handleBookClick = (bibliographyId: string) => {
    navigate(`/katalog/${bibliographyId}`);
  };

  const getStatusBadgeConfig = (bibliography: Bibliography) => {
    const stock = bibliography.stock ?? 0;
    if (stock > 0) {
      return {
        bg: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30",
        text: "text-green-700 dark:text-green-400",
        dot: "bg-green-500",
        label: "Tersedia",
      };
    }
    return {
      bg: "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30",
      text: "text-rose-700 dark:text-rose-400",
      dot: "bg-rose-500",
      label: "Stok Kosong",
    };
  };

  const filteredBooks = books.filter((book) => {
    const type = book.type || "physical_book";
    return type === activeTab;
  });

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Memuat buku populer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="bg-card border border-border/50 rounded-[28px] p-6 sm:p-8 md:p-10 shadow-sm space-y-6">
        {/* Tabs Header */}
        <div className="flex border-b border-border/40 gap-8 mb-4">
          <button
            onClick={() => setActiveTab("physical_book")}
            className={`pb-2 text-sm sm:text-base font-bold transition-all relative ${
              activeTab === "physical_book"
                ? "text-[#9D171D]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Buku Fisik
            {activeTab === "physical_book" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#9D171D] rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("ebook")}
            className={`pb-2 text-sm sm:text-base font-bold transition-all relative ${
              activeTab === "ebook"
                ? "text-[#9D171D]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            E-Book
            {activeTab === "ebook" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#9D171D] rounded-t-full" />
            )}
          </button>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.25);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.45);
          }
        `}</style>

        {filteredBooks.length === 0 ? (
          <div className="text-center py-10 bg-muted/20 border border-border/40 rounded-2xl">
            <p className="text-muted-foreground text-sm">Tidak ada buku populer kategori ini.</p>
          </div>
        ) : (
          /* Scrollable Book List */
          <div className="flex flex-col gap-3.5 max-h-[640px] overflow-y-auto pr-1.5 custom-scrollbar py-1">
            {filteredBooks.slice(0, 10).map((bibliography) => {
              const config = getStatusBadgeConfig(bibliography);
              const isEbook = bibliography.type === "ebook";
              const seedColor = generateColorFromSeed(bibliography.id);
              const authorNames = bibliography.authors && bibliography.authors.length > 0
                ? bibliography.authors.map((a) => a.name).join(", ")
                : "";

              return (
                <div
                  key={bibliography.id}
                  onClick={() => handleBookClick(bibliography.id)}
                  className="bg-card hover:bg-muted/40 border border-border/40 rounded-2xl p-3 sm:p-4 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-row items-center justify-between cursor-pointer group hover:-translate-y-0.5"
                >
                  {/* Left Side: Cover & Details */}
                  <div className="flex flex-row items-center gap-4 min-w-0">
                    {/* Book Cover Image */}
                    <div className="shrink-0 w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden shadow-xs bg-muted border border-border/30 relative">
                      {bibliography.image ? (
                        <img
                          src={bibliography.image}
                          alt={bibliography.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${seedColor} flex flex-col justify-between p-2 text-white`}>
                          <span className="text-[7px] font-bold uppercase tracking-wider text-white/50">
                            {isEbook ? "E-Book" : "Fisik"}
                          </span>
                          <span className="font-bold text-[9px] leading-tight italic line-clamp-3 text-center my-auto">
                            {bibliography.title}
                          </span>
                          <span className="text-[7px] text-white/40 line-clamp-1 text-right">
                            {authorNames || bibliography.sor || bibliography.publisher?.name || ""}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Book Details */}
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors mb-1">
                        {bibliography.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium mb-2.5">
                        {authorNames || bibliography.sor || "Penulis Tidak Diketahui"}
                      </p>
                      {/* Subjects / Categories */}
                      <div className="flex flex-wrap gap-1.5">
                        {bibliography.subjects && bibliography.subjects.length > 0 ? (
                          bibliography.subjects.slice(0, 2).map((sub) => (
                            <span
                              key={sub.id}
                              className="px-2 py-0.5 text-[9px] bg-muted text-muted-foreground border border-border rounded-full font-medium"
                            >
                              {sub.name}
                            </span>
                          ))
                        ) : bibliography.category ? (
                          <span className="px-2 py-0.5 text-[9px] bg-muted text-muted-foreground border border-border rounded-full font-medium">
                            {bibliography.category.name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] bg-muted text-muted-foreground border border-border rounded-full font-medium">
                            Umum
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Status Badge */}
                  <div className="shrink-0 ml-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${config.bg} ${config.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                      {config.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
