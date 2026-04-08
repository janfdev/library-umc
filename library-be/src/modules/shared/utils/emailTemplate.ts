type EmailAction = {
  label: string;
  url?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatContent(content: string): string {
  return escapeHtml(content).replace(/\n/g, "<br>");
}

function getLogoMarkup(): string {
  const logoUrl = process.env.EMAIL_LOGO_URL?.trim();

  if (logoUrl) {
    return `
      <img
        src="${escapeHtml(logoUrl)}"
        alt="Perpustakaan UMC"
        width="64"
        height="64"
        style="display:block;width:64px;height:64px;object-fit:contain;border-radius:16px;background:#ffffff;padding:10px;border:1px solid rgba(148,163,184,0.18);box-shadow:0 8px 24px rgba(15,23,42,0.08);"
      />
    `;
  }

  return `
    <div style="width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#0f4c81 0%,#1f7a8c 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-family:Arial,sans-serif;font-size:20px;font-weight:700;letter-spacing:0.08em;box-shadow:0 8px 24px rgba(15,23,42,0.12);">
      UMC
    </div>
  `;
}

export function buildEmailTemplate({
  title,
  headline,
  intro,
  content,
  footerNote,
  accent = "#0f4c81",
  action
}: {
  title: string;
  headline: string;
  intro?: string;
  content: string;
  footerNote?: string;
  accent?: string;
  action?: EmailAction;
}): string {
  const year = new Date().getFullYear();
  const introHtml = intro
    ? `<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>`
    : "";
  const actionHtml = action?.url
    ? `
      <div style="margin-top:28px;">
        <a href="${escapeHtml(action.url)}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:12px;font-size:14px;letter-spacing:0.02em;box-shadow:0 10px 24px rgba(15,76,129,0.18);">
          ${escapeHtml(action.label)}
        </a>
      </div>
    `
    : "";

  return `
    <div style="margin:0;padding:0;background:linear-gradient(180deg,#f8fafc 0%,#eef4fb 100%);font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(title)}
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:40px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:0 8px 18px;">
                  <div style="background:linear-gradient(135deg,#0f4c81 0%,#1f7a8c 100%);border-radius:26px 26px 18px 18px;padding:28px 28px 24px;box-shadow:0 20px 50px rgba(15,23,42,0.12);">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="vertical-align:middle;width:76px;">${getLogoMarkup()}</td>
                        <td style="vertical-align:middle;padding-left:16px;">
                          <div style="color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">Mucilib</div>
                          <div style="color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;margin-top:4px;">${escapeHtml(headline)}</div>
                          <div style="color:rgba(255,255,255,0.88);font-size:14px;line-height:1.6;margin-top:8px;">Perpustakaan Universitas Muhammadiyah Cirebon</div>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 8px;">
                  <div style="background:#ffffff;border:1px solid #dbe4f0;border-radius:18px;padding:30px;box-shadow:0 10px 30px rgba(15,23,42,0.06);">
                    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#0f172a;">${escapeHtml(title)}</h1>
                    ${introHtml}
                    <div style="font-size:15px;line-height:1.8;color:#334155;">${content}</div>
                    ${actionHtml}
                    <div style="margin-top:32px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.7;color:#64748b;">
                      ${escapeHtml(footerNote ?? "Pesan ini dikirim otomatis oleh sistem perpustakaan.")}
                      <div style="margin-top:8px;color:#94a3b8;">© ${year} Universitas Muhammadiyah Cirebon</div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export { escapeHtml, formatContent };
