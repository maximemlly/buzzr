import { resendVerification } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";
import { wrapAuthPage } from "../components/authLayout.js";
import { createAccentTitle } from "../components/accentTitle.js";

export function navigateToVerifyEmailPending(email, { message, replace = false } = {}) {
  const params = new URLSearchParams({ email });
  if (message) params.set("message", message);
  navigateTo(`/verify-email-pending?${params}`, { replace });
}

export function renderVerifyEmailPending(container) {
  container.replaceChildren();

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email")?.trim().toLowerCase() ?? "";
  const initialMessage = params.get("message");

  const panel = document.createElement("div");
  panel.className = "auth-form";

  panel.append(createAccentTitle("Confirmez votre e-mail"));

  const intro = document.createElement("p");
  intro.className = "auth-hint";
  intro.textContent =
    initialMessage ??
    "Un e-mail de confirmation vous a été envoyé. Cliquez sur le lien qu'il contient pour activer votre compte.";

  const emailEl = document.createElement("p");
  emailEl.className = "verify-email-address";
  emailEl.textContent = email || "—";

  const statusEl = document.createElement("p");
  statusEl.className = "success";
  statusEl.hidden = true;

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  const resendBtn = document.createElement("button");
  resendBtn.type = "button";
  resendBtn.className = "btn btn-primary btn-full";
  resendBtn.textContent = "Renvoyer l'e-mail";
  resendBtn.disabled = !email;

  const loginLink = document.createElement("p");
  loginLink.className = "auth-footer-link";
  loginLink.innerHTML = "E-mail confirmé ? <a href=\"/login\">Connectez-vous ici.</a>";
  loginLink.querySelector("a").addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/login");
  });

  panel.append(intro, emailEl, statusEl, errorEl, resendBtn, loginLink);
  container.append(wrapAuthPage(panel));

  if (!email) {
    errorEl.textContent = "Adresse e-mail manquante. Recommencez depuis l'inscription ou la connexion.";
    errorEl.hidden = false;
    return;
  }

  resendBtn.addEventListener("click", async () => {
    statusEl.hidden = true;
    errorEl.hidden = true;
    resendBtn.disabled = true;

    try {
      const data = await resendVerification(email);
      statusEl.textContent = data.message;
      statusEl.hidden = false;
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }

    resendBtn.disabled = false;
  });
}
