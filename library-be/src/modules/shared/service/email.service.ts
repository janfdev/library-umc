import { sendEmail } from "../../../config/mailer";
import {
  buildEmailTemplate,
  escapeHtml,
  formatContent
} from "../utils/emailTemplate";

export class EmailService {
  /**
   * Base method to send generic email
   */
  async send(to: string, subject: string, html: string) {
    try {
      const result = await sendEmail(to, subject, html);
      console.log(`[EmailService] Email sent to ${to}: ${result.id}`);
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error("[EmailService] Failed to send email:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Template for Library Announcement
   */
  async sendAnnouncement(toList: string[], subject: string, content: string) {
    const html = buildEmailTemplate({
      title: subject,
      headline: "Pengumuman",
      intro: "Pengumuman resmi dari perpustakaan.",
      content: formatContent(content),
      footerNote: "Ini adalah pesan otomatis dari sistem Perpustakaan UMC."
    });

    const results = await Promise.all(
      toList.map((email) => this.send(email, subject, html))
    );

    return results;
  }

  /**
   * Template for System Alerts (for Admins)
   */
  async sendSystemAlert(
    adminEmail: string,
    alertTitle: string,
    details: string
  ) {
    const html = buildEmailTemplate({
      title: alertTitle,
      headline: "System Alert",
      intro: "Perhatian, ada notifikasi sistem yang perlu ditindaklanjuti.",
      content: `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
          <tr>
            <td style="padding:14px 16px;font-size:13px;color:#374151;white-space:pre-wrap;word-break:break-word;">
              ${escapeHtml(details)}
            </td>
          </tr>
        </table>
        <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
          Waktu: ${escapeHtml(new Date().toLocaleString("id-ID"))}
        </p>
      `,
      footerNote: "Pesan ini dibuat khusus untuk admin sistem perpustakaan.",
      accent: "#9b1c1c"
    });
    return this.send(adminEmail, `[ALERT] ${alertTitle}`, html);
  }
}
