import { sendEmail } from "../../../config/mailer";

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
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="color: #0056b3; margin: 0;">MUCILIB - PERPUS UMC</h2>
        </div>
        <div style="line-height: 1.6; color: #333;">
          <h3 style="color: #444;">${subject}</h3>
          <p>${content.replace(/\n/g, "<br>")}</p>
        </div>
        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
          <p>Ini adalah pesan otomatis dari sistem Perpustakaan UMC.</p>
          <p>© ${new Date().getFullYear()} Universitas Muhammadiyah Cirebon</p>
        </div>
      </div>
    `;

    // Send to multiple users (sequentially or Promise.all)
    const results = await Promise.all(
      toList.map((email) => this.send(email, subject, html)),
    );

    return results;
  }

  /**
   * Template for System Alerts (for Admins)
   */
  async sendSystemAlert(
    adminEmail: string,
    alertTitle: string,
    details: string,
  ) {
    const html = `
      <div style="background-color: #fff5f5; border: 1px solid #c53030; padding: 15px; border-radius: 5px;">
        <h3 style="color: #c53030; margin-top: 0;">⚠️ System Alert: ${alertTitle}</h3>
        <p style="font-family: monospace; background: #eee; padding: 10px;">${details}</p>
        <p style="font-size: 12px;">Waktu: ${new Date().toLocaleString()}</p>
      </div>
    `;
    return this.send(adminEmail, `[ALERT] ${alertTitle}`, html);
  }
}
