import {
  Book,
  User,
  Info,
  Calendar,
  Hash,
  Layers,
  type LucideIcon
} from "lucide-react";
import Modal from "@/components/ui/modal";

interface Collection {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: string;
  isbn?: string;
  type: string;
  category?: {
    name: string;
  };
  categoryId?: string;
  stock: number;
  image: string | null;
}

type DetailRowProps = {
  icon: LucideIcon;
  label: string;
  value?: string;
  colorClass?: string;
};

interface ViewCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection | null;
}

const DetailRow = ({
  icon: Icon,
  label,
  value,
  colorClass = "text-slate-600"
}: DetailRowProps) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
      <Icon size={18} className="text-slate-400" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <p className={`text-[14px] font-bold mt-0.5 ${colorClass}`}>
        {value || "-"}
      </p>
    </div>
  </div>
);

export default function ViewCollectionModal({
  isOpen,
  onClose,
  collection
}: ViewCollectionModalProps) {
  if (!collection) return null;

  const stockValue = Number(collection.stock) || 0;
  const statusInfo =
    stockValue === 0
      ? {
          bg: "bg-orange-50",
          text: "text-orange-500",
          label: "Dipinjam / Stok Habis",
          iconColor: "text-orange-400"
        }
      : {
          bg: "bg-emerald-50",
          text: "text-emerald-600",
          label: "Tersedia",
          iconColor: "text-emerald-400"
        };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Koleksi" size="xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-1">
        {/* Left: Cover Image */}
        <div className="lg:col-span-4">
          <div className="aspect-3/4 rounded-[24px] overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center relative group">
            {collection.image ? (
              <img
                src={collection.image}
                alt={collection.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-300">
                <Book size={64} strokeWidth={1} />
                <p className="text-xs font-bold uppercase tracking-widest">
                  No Cover
                </p>
              </div>
            )}
            <div
              className={`absolute top-4 left-4 px-4 py-2 rounded-full text-[11px] font-extrabold shadow-lg backdrop-blur-md ${statusInfo.bg} ${statusInfo.text} border border-white/50`}
            >
              {statusInfo.label}
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-[24px] font-extrabold text-slate-900 leading-tight">
              {collection.title}
            </h3>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">
                {collection.category?.name || "Umum"}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold border border-slate-200 uppercase tracking-wider">
                {collection.type === "physical_book" ? "Buku Fisik" : "E-Book"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailRow
              icon={User}
              label="Pengarang"
              value={collection.author}
            />
            <DetailRow
              icon={Layers}
              label="Penerbit"
              value={collection.publisher}
            />
            <DetailRow
              icon={Calendar}
              label="Tahun Terbit"
              value={collection.publicationYear}
            />
            <DetailRow icon={Hash} label="ISBN" value={collection.isbn} />
            <DetailRow
              icon={Info}
              label="Status Stok"
              value={`${stockValue} Buku`}
              colorClass={statusInfo.text}
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
