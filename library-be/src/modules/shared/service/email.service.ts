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
      console.log(`[EmailService] Email sent to ${to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
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
      headline: "Announcement",
      intro: "Pengumuman resmi dari perpustakaan.",
      content: formatContent(content),
      footerNote: "Ini adalah pesan otomatis dari sistem Perpustakaan UMC."
    });

    // Send to multiple users (sequentially or Promise.all)
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
        <div style="background:#f8fafc;border:1px solid #dbe4f0;border-radius:14px;padding:16px 18px;color:#1e293b;font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;word-break:break-word;">${escapeHtml(details)}</div>
        <div style="margin-top:14px;color:#64748b;font-size:13px;">Waktu: ${escapeHtml(new Date().toLocaleString())}</div>
      `,
      footerNote: "Pesan ini dibuat untuk admin sistem perpustakaan.",
      accent: "#b42318"
    });
    return this.send(adminEmail, `[ALERT] ${alertTitle}`, html);
  }
}
