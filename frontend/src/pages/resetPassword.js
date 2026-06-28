import { resetPassword } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";
import { wrapAuthPage } from "../components/authLayout.js";
import { createAccentTitle } from "../components/accentTitle.js";

export function renderResetPassword(container) {
  container.replaceChildren();

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const form = document.createElement("form");
  form.className = "auth-form";

  form.append(createAccentTitle("Nouveau mot de passe"));

  if (!token) {
    const errorEl = document.createElement("p");
    errorEl.className = "error";
    errorEl.textContent = "Lien invalide : token manquant.";
    form.append(errorEl);
    container.append(wrapAuthPage(form));
    return;
  }

  const passwordLabel = document.createElement("label");
  passwordLabel.textContent = "Nouveau mot de passe";
  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.name = "password";
  passwordInput.required = true;
  passwordInput.minLength = 8;
  passwordInput.autocomplete = "new-password";
  passwordLabel.append(passwordInput);

  const confirmLabel = document.createElement("label");
  confirmLabel.textContent = "Confirmer le mot de passe";
  const confirmInput = document.createElement("input");
  confirmInput.type = "password";
  confirmInput.name = "passwordConfirm";
  confirmInput.required = true;
  confirmInput.minLength = 8;
  confirmInput.autocomplete = "new-password";
  confirmLabel.append(confirmInput);

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  const successEl = document.createElement("p");
  successEl.className = "success";
  successEl.hidden = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn btn-primary btn-full";
  submitBtn.textContent = "Valider";

  const backLink = document.createElement("a");
  backLink.href = "/login";
  backLink.className = "auth-link";
  backLink.textContent = "Retour à la connexion";
  backLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/login");
  });

  form.append(passwordLabel, confirmLabel, errorEl, successEl, submitBtn, backLink);
  container.append(wrapAuthPage(form));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    successEl.hidden = true;

    const password = passwordInput.value;
    const passwordConfirm = confirmInput.value;

    if (password !== passwordConfirm) {
      errorEl.textContent = "Les mots de passe ne correspondent pas";
      errorEl.hidden = false;
      return;
    }

    try {
      const data = await resetPassword(token, password, passwordConfirm);
      successEl.textContent = data.message;
      successEl.hidden = false;
      form.querySelectorAll("input, button[type=submit]").forEach((el) => {
        el.disabled = true;
      });
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}
