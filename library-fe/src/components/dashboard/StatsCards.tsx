import { Book, Users, TrendingUp, Layers } from "lucide-react";

interface StatsCardsProps {
  totalBibliographies: number;
  totalItems: number;
  loanedCount: number;
}

export default function StatsCards({
  totalBibliographies,
  totalItems,
  loanedCount,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Total Judul",
      value: totalBibliographies,
      icon: Book,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Buku",
      value: totalItems,
      icon: Layers,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Dipinjam",
      value: loanedCount,
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Tersedia",
      value:
        totalItems - loanedCount > 0 ? totalItems - loanedCount : 0,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">
                {stat.value}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
