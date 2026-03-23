export const formatRupiah = (amount: number | string): string => {
  const num = Number(amount) || 0;
  return `Rp. ${num.toLocaleString("id-ID")}`;
};

export const calcLateDays = (dueDate: string): number => {
  if (!dueDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = today.getTime() - due.getTime();
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
};

export const isOverdue = (dueDate: string): boolean => {
  return calcLateDays(dueDate) > 0;
};

export const formatDateID = (dateStr: string): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
