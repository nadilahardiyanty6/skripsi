import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;

if (!gmailUser || !gmailPass) {
  throw new Error("GMAIL_USER atau GMAIL_APP_PASSWORD belum di-set di .env");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
});

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return transporter.sendMail({
    from: process.env.MAIL_FROM || gmailUser,
    to,
    subject,
    html,
  });
}