const nodemailer = require("nodemailer");

function isMailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY ||
      (process.env.SMTP_HOST && process.env.SMTP_USER)
  );
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

  // Utiliser l'API HTTPS officielle de Resend (port 443)
  // pour contourner le blocage des ports SMTP (25/465/587) chez Railway
  const resendApiKey =
    process.env.RESEND_API_KEY ||
    (process.env.SMTP_HOST === "smtp.resend.com" ? process.env.SMTP_PASS : null);

  if (resendApiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("[mail:resend] Erreur API Resend :", errorData);
      throw new Error(
        `Resend API error (${res.status}): ${JSON.stringify(errorData)}`
      );
    }

    const data = await res.json();
    console.log(`[mail:resend] Email envoyé avec succès (id: ${data.id})`);
    return data;
  }

  const transport = createTransport();
  await transport.sendMail(payload);
}

module.exports = { sendMail, isMailConfigured };
