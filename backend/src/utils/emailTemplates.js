function baseEmailLayout({ title, content, footerNote }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #0d0b1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: separate; }
    a { color: #863bff; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0b1e; color: #f4f4f5;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0d0b1e; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #17142d; border-radius: 16px; border: 1px solid #2a254f; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.35);">
          <!-- Header / Brand Logo -->
          <tr>
            <td align="center" style="padding: 36px 32px 24px 32px; border-bottom: 1px solid #241f42;">
              <div style="font-size: 32px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                Buzz<span style="color: #863bff;">r</span>
              </div>
              <div style="font-size: 13px; color: #9d97bd; margin-top: 4px; font-weight: 500;">
                Quiz multijoueur en temps réel
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #110f22; border-top: 1px solid #241f42; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #7f789e; line-height: 1.5;">
                ${footerNote || "Vous recevez cet e-mail suite à une action effectuée sur Buzzr."}
              </p>
              <p style="margin: 0; font-size: 12px; color: #5f5979;">
                &copy; ${new Date().getFullYear()} Buzzr. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getVerificationEmailHtml({ username, link, expireHours }) {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
      Confirmez votre compte
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #c4c0db;">
      Bonjour <strong style="color: #ffffff;">${username}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #c4c0db;">
      Bienvenue sur Buzzr ! Cliquez sur le bouton ci-dessous pour valider votre adresse e-mail et commencer à jouer.
    </p>

    <!-- Bouton CTA -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
      <tr>
        <td align="center" bgcolor="#863bff" style="border-radius: 8px;">
          <a href="${link}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Confirmer mon compte &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 13px; color: #9d97bd; line-height: 1.5;">
      Ce lien de confirmation expire dans <strong>${expireHours} heures</strong>.
    </p>

    <div style="padding-top: 16px; border-top: 1px dashed #2a254f;">
      <p style="margin: 0 0 6px 0; font-size: 12px; color: #7f789e;">
        Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
      </p>
      <a href="${link}" target="_blank" style="font-size: 12px; color: #a772ff; word-break: break-all;">
        ${link}
      </a>
    </div>
  `;

  return baseEmailLayout({
    title: "Confirmez votre compte Buzzr",
    content,
    footerNote: "Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet e-mail en toute sécurité.",
  });
}

function getResetEmailHtml({ username, link, expireHours }) {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
      Réinitialisation de mot de passe
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #c4c0db;">
      Bonjour <strong style="color: #ffffff;">${username}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #c4c0db;">
      Une demande de réinitialisation de mot de passe a été demandée pour votre compte Buzzr. Cliquez sur le bouton ci-dessous pour choisir votre nouveau mot de passe :
    </p>

    <!-- Bouton CTA -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
      <tr>
        <td align="center" bgcolor="#863bff" style="border-radius: 8px;">
          <a href="${link}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Changer mon mot de passe &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 13px; color: #9d97bd; line-height: 1.5;">
      Ce lien de sécurité est temporaire et expire dans <strong>${expireHours} heure${expireHours > 1 ? "s" : ""}</strong>.
    </p>

    <div style="padding-top: 16px; border-top: 1px dashed #2a254f;">
      <p style="margin: 0 0 6px 0; font-size: 12px; color: #7f789e;">
        Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
      </p>
      <a href="${link}" target="_blank" style="font-size: 12px; color: #a772ff; word-break: break-all;">
        ${link}
      </a>
    </div>
  `;

  return baseEmailLayout({
    title: "Réinitialisation de mot de passe — Buzzr",
    content,
    footerNote: "Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet e-mail. Votre mot de passe actuel reste inchangé.",
  });
}

module.exports = {
  getVerificationEmailHtml,
  getResetEmailHtml,
};
