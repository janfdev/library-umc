import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("[Mailer Config] SMTP Connection Error:");
    console.error(error);
  } else {
    console.log("[Mailer Config] Server IS READY to send emails");
  }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  return transporter.sendMail({
    from: `"Perpustakaan UMC" <${process.env.GOOGLE_EMAIL}>`,
    to,
    subject,
    html,
  });
};
