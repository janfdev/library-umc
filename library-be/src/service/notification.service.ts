import { sendEmail } from "../config/mailer";

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
    tanggalPengembalian: string,
  ) {
    try {
      const subject =
        "Selamat Anda Berhasil Meminjam Buku di Perpustakaan Universitas Muhammadiyah Cirebon";
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>${subject}</h1>
          <p>Halo ${name},</p>
          <p>Anda berhasil meminjam buku:</p>
          <p><strong>Judul Buku:</strong> ${bookTitle}</p>
          <p><strong>Tanggal Pengembalian:</strong> ${tanggalPengembalian}</p>
          <p>Silahkan kembalikan buku sebelum tanggal pengembalian.</p>
          <p>Terima kasih.</p>
        </div>
      `;

      await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error(
        "[NotificationService] Failed to send loan notification:",
        error,
      );
    }
  }

  async sendFinesNotification(
    email: string,
    name: string,
    amount: number,
    bookTitle: string,
  ) {
    try {
      const subject = "Denda Keterlambatan Peminjaman Buku";
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Denda Keterlambatan Peminjaman Buku</h2>
          <p>Halo ${name},</p>
          <p>Anda memiliki denda keterlambatan peminjaman buku:</p>
          <p><strong>Judul Buku:</strong> ${bookTitle}</p>
          <p><strong>Jumlah Denda:</strong> Rp ${amount.toLocaleString("id-ID")}</p>
          <p>Silahkan segera selesaikan pembayaran denda di perpustakaan.</p>
          <p>Terima kasih.</p>
        </div>
      `;

      await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error(
        "[NotificationService] Failed to send fine notification:",
        error,
      );
    }
  }

  async sendReservationFulfilledNotification(
    email: string,
    name: string,
    bookTitle: string,
  ) {
    try {
      const subject = "Reservasi Buku Anda Sudah Tersedia — Perpustakaan UMC";
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🎉 Buku Reservasi Anda Sudah Tersedia!</h2>
          <p>Halo ${name},</p>
          <p>Kabar baik! Buku yang Anda reservasi sudah tersedia untuk dipinjam:</p>
          <p><strong>Judul Buku:</strong> ${bookTitle}</p>
          <p>Silakan segera datang ke perpustakaan untuk mengambil buku tersebut <strong>dalam 3 hari ke depan</strong>.</p>
          <p>Jika tidak diambil dalam batas waktu tersebut, reservasi Anda akan dibatalkan secara otomatis.</p>
          <br/>
          <p>Terima kasih,</p>
          <p><strong>Perpustakaan Universitas Muhammadiyah Cirebon</strong></p>
        </div>
      `;

      await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error(
        "[NotificationService] Failed to send reservation notification:",
        error,
      );
    }
  }
}
