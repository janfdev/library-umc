import { db } from "../../../db";
import {
  collections,
  items,
  loans,
  members,
  fines,
  guestLogs,
  reservations,
} from "../../../db/schema";
import { eq, sql, and, desc, isNull } from "drizzle-orm";
import PDFDocument from "pdfkit";
import { type Response } from "express";

export class ReportService {
  /**
   * Get main dashboard statistics summary
   */
  async getDashboardStats() {
    try {
      const [totalCollections] = await db
        .select({ count: sql<number>`count(*)` })
        .from(collections)
        .where(isNull(collections.deletedAt));

      const [totalItems] = await db
        .select({ count: sql<number>`count(*)` })
        .from(items)
        .where(isNull(items.deletedAt));

      const [activeLoans] = await db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(sql`${loans.status} IN ('approved', 'pending')`);

      const [overdueLoans] = await db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(
          and(
            eq(loans.status, "approved"),
            sql`${loans.dueDate} < CURRENT_DATE`,
          ),
        );

      const [totalMembers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(members);

      const [unpaidFines] = await db
        .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
        .from(fines)
        .where(eq(fines.status, "unpaid"));

      const [waitingReservations] = await db
        .select({ count: sql<number>`count(*)` })
        .from(reservations)
        .where(
          and(
            eq(reservations.status, "waiting"),
            isNull(reservations.deletedAt),
          ),
        );

      return {
        success: true,
        data: {
          totalCollections: Number(totalCollections.count),
          totalItems: Number(totalItems.count),
          activeLoans: Number(activeLoans.count),
          overdueLoans: Number(overdueLoans.count),
          totalMembers: Number(totalMembers.count),
          unpaidFinesTotal: Number(unpaidFines.total),
          waitingReservations: Number(waitingReservations.count),
        },
      };
    } catch (error) {
      console.error("[ReportService] getDashboardStats error:", error);
      throw error;
    }
  }

  /**
   * Get top most borrowed books
   */
  async getPopularBooks(limit = 10) {
    try {
      const result = await db
        .select({
          id: collections.id,
          title: collections.title,
          author: collections.author,
          image: collections.image,
          loanCount: sql<number>`count(${loans.id})`,
        })
        .from(collections)
        .innerJoin(items, eq(items.collectionId, collections.id))
        .innerJoin(loans, eq(loans.itemId, items.id))
        .where(isNull(collections.deletedAt))
        .groupBy(collections.id)
        .orderBy(desc(sql`count(${loans.id})`))
        .limit(limit);

      return { success: true, data: result };
    } catch (error) {
      console.error("[ReportService] getPopularBooks error:", error);
      throw error;
    }
  }

  /**
   * Get guest visit statistics for the last 7 days
   */
  async getGuestStats() {
    try {
      const result = await db
        .select({
          date: sql<string>`DATE(${guestLogs.visitDate})`,
          count: sql<number>`count(*)`,
        })
        .from(guestLogs)
        .where(sql`${guestLogs.visitDate} >= CURRENT_DATE - INTERVAL '7 days'`)
        .groupBy(sql`DATE(${guestLogs.visitDate})`)
        .orderBy(sql`DATE(${guestLogs.visitDate})`);

      return { success: true, data: result };
    } catch (error) {
      console.error("[ReportService] getGuestStats error:", error);
      throw error;
    }
  }

  /**
   * Get detailed loan report (for export)
   */
  async getLoanReport(
    filters: { status?: string; from?: string; to?: string } = {},
  ) {
    try {
      const conditions = [];
      if (filters.status) {
        conditions.push(sql`${loans.status} = ${filters.status}`);
      }
      if (filters.from) {
        conditions.push(sql`${loans.createdAt} >= ${filters.from}::date`);
      }
      if (filters.to) {
        conditions.push(
          sql`${loans.createdAt} <= ${filters.to}::date + INTERVAL '1 day'`,
        );
      }

      const result = await db.query.loans.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          member: { with: { user: true } },
          item: { with: { collection: true } },
        },
        orderBy: [desc(loans.createdAt)],
      });

      return { success: true, data: result };
    } catch (error) {
      console.error("[ReportService] getLoanReport error:", error);
      throw error;
    }
  }

  /**
   * Get fines report (for export)
   */
  async getFinesReport(filters: { status?: string } = {}) {
    try {
      const conditions = [];
      if (filters.status) {
        conditions.push(sql`${fines.status} = ${filters.status}`);
      }

      const result = await db.query.fines.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          loan: {
            with: {
              member: { with: { user: true } },
              item: { with: { collection: true } },
            },
          },
        },
        orderBy: [desc(fines.createdAt)],
      });

      return { success: true, data: result };
    } catch (error) {
      console.error("[ReportService] getFinesReport error:", error);
      throw error;
    }
  }

  // ============================================================
  // EXPORT HELPERS
  // ============================================================

  /**
   * Export any data array to CSV and stream to response
   */
  exportToCSV<T extends Record<string, unknown>>(
    res: Response,
    filename: string,
    data: T[],
    columns: { key: keyof T; header: string }[],
  ): void {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}.csv"`,
    );

    // BOM for Excel UTF-8 compatibility
    res.write("\uFEFF");

    // Header row
    res.write(columns.map((c) => `"${c.header}"`).join(",") + "\n");

    // Data rows
    for (const row of data) {
      const line = columns
        .map((c) => {
          const val = row[c.key] ?? "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",");
      res.write(line + "\n");
    }

    res.end();
  }

  /**
   * Export loan report to PDF and stream to response
   */
  exportLoansToPDF(
    res: Response,
    data: Array<{
      memberName?: string;
      bookTitle?: string;
      status?: string;
      borrowDate?: string;
      dueDate?: string;
      returnDate?: string | null;
    }>,
    title = "Laporan Peminjaman Buku",
  ): void {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="laporan-peminjaman.pdf"`,
    );

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    // Header
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("MUCILIB — Perpustakaan UMC", { align: "center" });
    doc.fontSize(13).font("Helvetica").text(title, { align: "center" });
    doc.fontSize(9).text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, {
      align: "center",
    });
    doc.moveDown(1);

    // Table Header
    const colWidths = [160, 100, 70, 80, 80];
    const headers = [
      "Peminjam",
      "Judul Buku",
      "Status",
      "Tgl Pinjam",
      "Tgl Kembali",
    ];
    const startX = 40;
    let y = doc.y;

    doc.font("Helvetica-Bold").fontSize(9);
    doc.rect(startX, y, 515, 16).fill("#2563EB");
    doc.fill("white");
    let x = startX + 4;
    headers.forEach((h, i) => {
      doc.text(h, x, y + 3, { width: colWidths[i] - 4, lineBreak: false });
      x += colWidths[i];
    });
    doc.fill("black");
    y += 16;

    // Table Rows
    doc.font("Helvetica").fontSize(8);
    data.forEach((row, idx) => {
      if (y > 740) {
        doc.addPage();
        y = 40;
      }
      const bg = idx % 2 === 0 ? "#F1F5F9" : "white";
      doc.rect(startX, y, 515, 14).fill(bg);
      doc.fill("black");

      x = startX + 4;
      const cols = [
        row.memberName ?? "-",
        row.bookTitle ?? "-",
        row.status ?? "-",
        row.borrowDate ?? "-",
        row.returnDate ?? row.dueDate ?? "-",
      ];
      cols.forEach((val, i) => {
        doc.text(String(val).substring(0, 25), x, y + 3, {
          width: colWidths[i] - 4,
          lineBreak: false,
        });
        x += colWidths[i];
      });
      y += 14;
    });

    doc.moveDown(1);
    doc
      .fontSize(8)
      .fill("#64748B")
      .text(`Total: ${data.length} records`, startX);

    doc.end();
  }
}

export default new ReportService();
