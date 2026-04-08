export interface ReportImportSummary {
  successfulLoans: number;
  activeBorrowings: number;
  totalPaidFines: number;
  outstandingFines: number;
  popularBooks: Array<{ title: string; loanCount: number }>;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function toNumericCurrency(value: string): number {
  const numeric = value.replace(/[^\d-]/g, "");
  return Number(numeric || "0");
}

export function analyzeReportCsv(csvText: string): ReportImportSummary | null {
  const normalized = csvText.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return null;
  }

  const headers = parseCsvLine(lines[0]).map((header) =>
    header.replace(/^"|"$/g, "")
  );

  const statusLoanIndex = headers.findIndex(
    (header) => header.toLowerCase() === "status"
  );
  const statusFineIndex = headers.findIndex(
    (header) => header.toLowerCase() === "status denda"
  );
  const amountFineIndex = headers.findIndex(
    (header) => header.toLowerCase() === "jumlah denda"
  );
  const titleIndex = headers.findIndex(
    (header) => header.toLowerCase() === "judul buku"
  );

  let successfulLoans = 0;
  let activeBorrowings = 0;
  let totalPaidFines = 0;
  let outstandingFines = 0;
  const titleCounter = new Map<string, number>();

  lines.slice(1).forEach((line) => {
    const row = parseCsvLine(line).map((cell) => cell.replace(/^"|"$/g, ""));

    if (statusLoanIndex >= 0) {
      const loanStatus = row[statusLoanIndex]?.toLowerCase() ?? "";

      if (["approved", "returned", "pending"].includes(loanStatus)) {
        successfulLoans += 1;
      }

      if (["approved", "pending"].includes(loanStatus)) {
        activeBorrowings += 1;
      }
    }

    if (statusFineIndex >= 0 && amountFineIndex >= 0) {
      const fineStatus = row[statusFineIndex]?.toLowerCase() ?? "";
      const amount = toNumericCurrency(row[amountFineIndex] ?? "0");

      if (fineStatus === "paid") {
        totalPaidFines += amount;
      }
      if (fineStatus === "unpaid") {
        outstandingFines += amount;
      }
    }

    if (titleIndex >= 0) {
      const title = (row[titleIndex] ?? "").trim();
      if (title) {
        titleCounter.set(title, (titleCounter.get(title) ?? 0) + 1);
      }
    }
  });

  const popularBooks = Array.from(titleCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, loanCount]) => ({
      title,
      loanCount
    }));

  return {
    successfulLoans,
    activeBorrowings,
    totalPaidFines,
    outstandingFines,
    popularBooks
  };
}
