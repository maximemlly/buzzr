import { register } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";
import { createPrivacyLink } from "../components/privacyLink.js";
import { wrapAuthPage } from "../components/authLayout.js";
import { createAccentTitle } from "../components/accentTitle.js";
import { createPlaceholderField } from "../components/authField.js";
import { navigateToVerifyEmailPending } from "./verifyEmailPending.js";

export function renderRegister(container) {
  container.replaceChildren();

  const form = document.createElement("form");
  form.id = "register-form";
  form.className = "auth-form";

  form.append(createAccentTitle("Inscription"));

  const usernameInput = createPlaceholderField("text", "username", "Nom d'utilisateur", {
    autocomplete: "username",
  });
  const emailInput = createPlaceholderField("email", "email", "Adresse e-mail", {
    autocomplete: "email",
  });
  const passwordInput = createPlaceholderField("password", "password", "Mot de passe", {
    autocomplete: "new-password",
    minLength: 8,
  });
  const confirmInput = createPlaceholderField("password", "passwordConfirm", "Confirmer mot de passe", {
    autocomplete: "new-password",
    minLength: 8,
  });

  const consentLabel = document.createElement("label");
  consentLabel.className = "consent-label";
  const consentInput = document.createElement("input");
  consentInput.type = "checkbox";
  consentInput.name = "privacyConsent";
  consentInput.required = true;
  const consentText = document.createElement("span");
  consentText.append("J'accepte la ", createPrivacyLink(), ".");
  consentLabel.append(consentInput, consentText);

  const errorEl = document.createElement("p");
  errorEl.id = "register-error";
  errorEl.className = "error";
  errorEl.hidden = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn btn-primary btn-full";
  submitBtn.textContent = "Valider";

  const loginLink = document.createElement("p");
  loginLink.className = "auth-footer-link";
  loginLink.innerHTML = "Déjà inscrit ? <a href=\"/login\">Connectez-vous ici.</a>";
  loginLink.querySelector("a").addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/login");
  });

  form.append(
    usernameInput,
    emailInput,
    passwordInput,
    confirmInput,
    consentLabel,
    errorEl,
    submitBtn,
    loginLink,
  );
  container.append(wrapAuthPage(form));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const password = passwordInput.value;
    const passwordConfirm = confirmInput.value;

    if (password !== passwordConfirm) {
      errorEl.textContent = "Les mots de passe ne correspondent pas";
      errorEl.hidden = false;
      return;
    }

    try {
      const data = await register(
        usernameInput.value.trim(),
        emailInput.value.trim(),
        password,
        passwordConfirm,
      );
      navigateToVerifyEmailPending(emailInput.value.trim().toLowerCase(), {
        message: data.message,
        replace: true,
      });
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}
