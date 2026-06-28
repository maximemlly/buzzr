import { verifyEmail } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";
import { wrapAuthPage } from "../components/authLayout.js";
import { createAccentTitle } from "../components/accentTitle.js";

export function renderVerifyEmail(container) {
  container.replaceChildren();

  const panel = document.createElement("div");
  panel.className = "auth-form";

  panel.append(createAccentTitle("Vérification"));

  const messageEl = document.createElement("p");
  messageEl.textContent = "Vérification en cours…";
  panel.append(messageEl);

  const loginLink = document.createElement("a");
  loginLink.href = "/login";
  loginLink.className = "auth-link";
  loginLink.textContent = "Aller à la connexion";
  loginLink.hidden = true;
  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/login");
  });
  panel.append(loginLink);

  container.append(wrapAuthPage(panel));

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    messageEl.textContent = "Lien invalide : token manquant.";
    messageEl.className = "error";
    loginLink.hidden = false;
    return;
  }

  verifyEmail(token)
    .then((data) => {
      messageEl.textContent = data.message;
      messageEl.className = "success";
      loginLink.hidden = false;
    })
    .catch((err) => {
      messageEl.textContent = err.message;
      messageEl.className = "error";
      loginLink.hidden = false;
    });
}
