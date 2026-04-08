import { sendEmail } from "../../../config/mailer";
import {
  buildEmailTemplate,
  escapeHtml
} from "../../shared/utils/emailTemplate";

export class NotificationService {
  async sendEmail(to: string, subject: string, html: string) {
    try {
      await sendEmail(to, subject, html);
    } catch (error) {
      console.error("[NotificationService] Failed to send email:", error);
    }
  }

  async sendLoansNotification(
    email: string,
    name: string,
    bookTitle: string,
    tanggalPengembalian: string
  ) {
    try {
      const subject =
        "Selamat Anda Berhasil Meminjam Buku di Perpustakaan Universitas Muhammadiyah Cirebon";
      const html = buildEmailTemplate({
        title: "Peminjaman Buku Berhasil",
        headline: "Loan Confirmation",
        intro: `Halo ${name}, peminjaman buku Anda sudah berhasil diproses.`,
        content: `
          <div style="display:grid;gap:12px;">
            <div style="background:#f8fafc;border:1px solid #dbe4f0;border-radius:14px;padding:16px 18px;">
              <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Judul Buku</div>
              <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:4px;">${escapeHtml(bookTitle)}</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #dbe4f0;border-radius:14px;padding:16px 18px;">
              <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Tanggal Pengembalian</div>
              <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:4px;">${escapeHtml(tanggalPengembalian)}</div>
            </div>
            <div style="background:#ecfdf3;border:1px solid #b7ebc6;border-radius:14px;padding:16px 18px;color:#14532d;">
              Silakan kembalikan buku sebelum tanggal pengembalian agar tidak terkena denda.
            </div>
          </div>
        `,
        footerNote: "Terima kasih telah menggunakan layanan Perpustakaan UMC."
      });

      await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error(
        "[NotificationService] Failed to send loan notification:",
        error
      );
    }
  }

  async sendFinesNotification(
    email: string,
    name: string,
    amount: number,
    bookTitle: string
  ) {
    try {
      const subject = "Denda Keterlambatan Peminjaman Buku";
      const html = buildEmailTemplate({
        title: "Notifikasi Denda",
        headline: "Fine Reminder",
        intro: `Halo ${name}, sistem mendeteksi adanya denda keterlambatan pada akun Anda.`,
        content: `
          <div style="display:grid;gap:12px;">
            <div style="background:#f8fafc;border:1px solid #dbe4f0;border-radius:14px;padding:16px 18px;">
              <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Judul Buku</div>
              <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:4px;">${escapeHtml(bookTitle)}</div>
            </div>
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:16px 18px;">
              <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9a3412;font-weight:700;">Jumlah Denda</div>
              <div style="font-size:22px;font-weight:800;color:#c2410c;margin-top:4px;">Rp ${amount.toLocaleString("id-ID")}</div>
            </div>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:16px 18px;color:#991b1b;">
              Silakan segera selesaikan pembayaran denda di perpustakaan.
            </div>
          </div>
        `,
        footerNote: "Mohon abaikan pesan ini jika denda sudah dibayarkan.",
        accent: "#b42318"
      });

      await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error(
        "[NotificationService] Failed to send fine notification:",
        error
      );
    }
  }

  async sendReservationFulfilledNotification(
    email: string,
    name: string,
    bookTitle: string
  ) {
    try {
      const subject = "Reservasi Buku Anda Sudah Tersedia — Perpustakaan UMC";
      const html = buildEmailTemplate({
        title: "Reservasi Tersedia",
        headline: "Reservation Ready",
        intro: `Halo ${name}, buku yang Anda reservasi sudah tersedia untuk diambil.`,
        content: `
          <div style="display:grid;gap:12px;">
            <div style="background:#f8fafc;border:1px solid #dbe4f0;border-radius:14px;padding:16px 18px;">
              <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Judul Buku</div>
              <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:4px;">${escapeHtml(bookTitle)}</div>
            </div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:16px 18px;color:#1d4ed8;">
              Silakan datang ke perpustakaan untuk mengambil buku tersebut dalam <strong>3 hari ke depan</strong>.
            </div>
            <div style="background:#fefce8;border:1px solid #fde68a;border-radius:14px;padding:16px 18px;color:#854d0e;">
              Jika tidak diambil dalam batas waktu tersebut, reservasi akan dibatalkan otomatis.
            </div>
          </div>
        `,
        footerNote:
          "Terima kasih telah menggunakan layanan reservasi Perpustakaan UMC."
      });

      await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error(
        "[NotificationService] Failed to send reservation notification:",
        error
      );
    }
  }
}
