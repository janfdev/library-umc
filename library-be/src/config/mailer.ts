import nodemailer, { type SentMessageInfo } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Validasi env vars wajib saat startup
const GOOGLE_EMAIL = process.env.GOOGLE_EMAIL;
const GOOGLE_APP_PASSWORD = process.env.GOOGLE_APP_PASSWORD;

if (!GOOGLE_EMAIL || !GOOGLE_APP_PASSWORD) {
  console.warn(
    "[Mailer Config] WARNING: GOOGLE_EMAIL atau GOOGLE_APP_PASSWORD tidak di-set. " +
      "Email tidak akan bisa terkirim."
  );
}


export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  auth: {
    user: GOOGLE_EMAIL,
    pass: GOOGLE_APP_PASSWORD,
  },
  pool: true,          // Reuse koneksi antar pengiriman
  maxConnections: 2,   // Batasi koneksi paralel agar tidak rate-limited
  socketTimeout: 30000,   // 30 detik timeout per socket
  greetingTimeout: 15000, // 15 detik tunggu greeting SMTP
  connectionTimeout: 15000, // 15 detik timeout koneksi awal
  logger: process.env.NODE_ENV !== "production", // Log detail di development
  debug: process.env.NODE_ENV !== "production",  // Debug SMTP handshake di development
});

// Verifikasi koneksi saat startup (non-fatal)
transporter.verify((error) => {
  if (error) {
    console.error("[Mailer Config] SMTP Connection Error:", error.message);
    console.error(
      "[Mailer Config] Periksa: GOOGLE_EMAIL, GOOGLE_APP_PASSWORD, " +
        "dan pastikan Gmail App Password sudah dibuat (bukan password biasa)."
    );
  } else {
    console.log("[Mailer Config] SMTP Server SIAP mengirim email via smtp.gmail.com:465");
  }
});

/**
 * Kirim email dengan retry otomatis 1x jika gagal.
 * Error di-log tapi tidak mematikan proses utama.
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  retryCount = 0
): Promise<SentMessageInfo> => {
  const MAX_RETRY = 1;

  try {
    const result = await transporter.sendMail({
      from: `"Perpustakaan UMC" <${GOOGLE_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`[Mailer] Email terkirim ke: ${to} | Subjek: "${subject}"`);
    return result;
  } catch (error: any) {
    console.error(
      `[Mailer] Gagal kirim email ke ${to} (percobaan ${retryCount + 1}):`,
      error?.message ?? error
    );

    if (retryCount < MAX_RETRY) {
      // Tunggu 3 detik lalu coba sekali lagi
      console.log(`[Mailer] Mencoba ulang dalam 3 detik...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return sendEmail(to, subject, html, retryCount + 1);
    }

    // Lempar error setelah semua retry habis
    throw new Error(
      `[Mailer] Gagal mengirim email setelah ${MAX_RETRY + 1} percobaan: ${error?.message}`
    );
  }
};
