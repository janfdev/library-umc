import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM: string =
  process.env.EMAIL_FROM || "Perpustakaan UMC <info@daafun.my.id>";

if (!RESEND_API_KEY) {
  console.warn(
    "[Mailer Config] WARNING: RESEND_API_KEY tidak di-set. " +
      "Email tidak akan bisa terkirim.",
  );
}

const resend = new Resend(RESEND_API_KEY);

/**
 * Kirim email menggunakan Resend API (HTTP, tidak blokir seperti SMTP).
 * Sudah include retry 1x jika terjadi error.
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  retryCount = 0,
): Promise<{ id: string }> => {
  const MAX_RETRY = 1;

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`[Mailer] Email terkirim ke: ${to} | ID: ${data?.id}`);
    return { id: data!.id };
  } catch (error: any) {
    console.error(
      `[Mailer] Gagal kirim email ke ${to} (percobaan ${retryCount + 1}):`,
      error?.message ?? error,
    );

    if (retryCount < MAX_RETRY) {
      console.log(`[Mailer] Mencoba ulang dalam 3 detik...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return sendEmail(to, subject, html, retryCount + 1);
    }

    throw new Error(
      `[Mailer] Gagal mengirim email setelah ${MAX_RETRY + 1} percobaan: ${error?.message}`,
    );
  }
};
