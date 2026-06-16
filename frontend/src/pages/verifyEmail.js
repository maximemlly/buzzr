import { verifyEmail } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";

export function renderVerifyEmail(container) {
  container.replaceChildren();

  const panel = document.createElement("div");
  panel.className = "auth-form";

  const title = document.createElement("h1");
  title.textContent = "Vérification de l'e-mail";
  panel.append(title);

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

  container.append(panel);

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
