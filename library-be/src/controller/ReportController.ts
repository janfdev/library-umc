/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Request, type Response, type NextFunction } from "express";
import reportService from "../service/report.service";

class ReportController {
  // GET /reports/dashboard
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportService.getDashboardStats();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /reports/popular-books?limit=10
  async getPopularBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const result = await reportService.getPopularBooks(limit);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /reports/guest-stats
  async getGuestStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportService.getGuestStats();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /reports/loans/export?format=csv|pdf&status=approved&from=2025-01-01&to=2025-12-31
  async exportLoans(req: Request, res: Response, next: NextFunction) {
    try {
      const { format = "csv", status, from, to } = req.query;

      const { data } = await reportService.getLoanReport({
        status: status as string,
        from: from as string,
        to: to as string,
      });

      const rows = data.map((loan) => ({
        memberName: (loan as any).member?.user?.name ?? "-",
        memberEmail: (loan as any).member?.user?.email ?? "-",
        bookTitle: (loan as any).item?.collection?.title ?? "-",
        ISBN: (loan as any).item?.collection?.ISBN ?? "-",
        status: (loan as any).status,
        borrowDate: (loan as any).createdAt
          ? new Date((loan as any).createdAt).toLocaleDateString("id-ID")
          : "-",
        dueDate: (loan as any).dueDate ?? "-",
        returnDate: (loan as any).returnDate ?? "-",
      }));

      if (format === "pdf") {
        const pdfRows = rows.map((r) => ({
          memberName: r.memberName,
          bookTitle: r.bookTitle,
          status: r.status,
          borrowDate: r.borrowDate,
          dueDate: r.dueDate,
          returnDate: r.returnDate || null,
        }));
        return reportService.exportLoansToPDF(
          res,
          pdfRows,
          "Laporan Peminjaman Buku",
        );
      }

      // Default: CSV
      return reportService.exportToCSV(res, "laporan-peminjaman", rows, [
        { key: "memberName", header: "Nama Peminjam" },
        { key: "memberEmail", header: "Email" },
        { key: "bookTitle", header: "Judul Buku" },
        { key: "ISBN", header: "ISBN" },
        { key: "status", header: "Status" },
        { key: "borrowDate", header: "Tgl Pinjam" },
        { key: "dueDate", header: "Tgl Jatuh Tempo" },
        { key: "returnDate", header: "Tgl Kembali" },
      ]);
    } catch (error) {
      next(error);
    }
  }

  // GET /reports/fines/export?format=csv&status=unpaid
  async exportFines(req: Request, res: Response, next: NextFunction) {
    try {
      const { format = "csv", status } = req.query;

      const { data } = await reportService.getFinesReport({
        status: status as string,
      });

      const rows = data.map((fine) => ({
        memberName: (fine as any).loan?.member?.user?.name ?? "-",
        memberEmail: (fine as any).loan?.member?.user?.email ?? "-",
        bookTitle: (fine as any).loan?.item?.collection?.title ?? "-",
        amount: `Rp ${Number((fine as any).amount).toLocaleString("id-ID")}`,
        status: (fine as any).status,
        createdAt: (fine as any).createdAt
          ? new Date((fine as any).createdAt).toLocaleDateString("id-ID")
          : "-",
      }));

      if (format === "pdf") {
        // Reuse loan PDF renderer with fines columns
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="laporan-denda.pdf"`,
        );
        const pdfRows = rows.map((r) => ({
          memberName: r.memberName,
          bookTitle: r.bookTitle,
          status: r.status,
          borrowDate: r.createdAt,
          dueDate: r.amount,
          returnDate: null,
        }));
        return reportService.exportLoansToPDF(
          res,
          pdfRows,
          "Laporan Denda Peminjaman",
        );
      }

      return reportService.exportToCSV(res, "laporan-denda", rows, [
        { key: "memberName", header: "Nama Member" },
        { key: "memberEmail", header: "Email" },
        { key: "bookTitle", header: "Judul Buku" },
        { key: "amount", header: "Jumlah Denda" },
        { key: "status", header: "Status Denda" },
        { key: "createdAt", header: "Tgl Denda Dibuat" },
      ]);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();
