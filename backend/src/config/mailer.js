const nodemailer = require("nodemailer");

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || "Buzzr <noreply@buzzr.local>";
  const payload = { from, to, subject, text, html };

  if (!isMailConfigured()) {
    console.log("[mail:dev] SMTP non configuré — email non envoyé :");
    console.log(payload);
    return;
  }

  const transport = createTransport();
  await transport.sendMail(payload);
}

module.exports = { sendMail, isMailConfigured };
