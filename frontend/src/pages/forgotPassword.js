import { forgotPassword } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";
import { wrapAuthPage } from "../components/authLayout.js";
import { createAccentTitle } from "../components/accentTitle.js";

export function renderForgotPassword(container) {
  container.replaceChildren();

  const form = document.createElement("form");
  form.className = "auth-form";

  form.append(createAccentTitle("Mot de passe oublié"));

  const hint = document.createElement("p");
  hint.className = "auth-hint";
  hint.textContent =
    "Entrez votre adresse e-mail. Si un compte existe, vous recevrez un lien de réinitialisation.";
  form.append(hint);

  const emailLabel = document.createElement("label");
  emailLabel.textContent = "Adresse e-mail";
  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.name = "email";
  emailInput.required = true;
  emailInput.autocomplete = "email";
  emailLabel.append(emailInput);

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

  form.append(emailLabel, errorEl, successEl, submitBtn, backLink);
  container.append(wrapAuthPage(form));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    successEl.hidden = true;

    try {
      const data = await forgotPassword(emailInput.value.trim());
      successEl.textContent = data.message;
      successEl.hidden = false;
      submitBtn.disabled = true;
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}
