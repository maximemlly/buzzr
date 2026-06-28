import { login, saveToken } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";
import { createPrivacyLink } from "../components/privacyLink.js";
import { wrapAuthPage } from "../components/authLayout.js";
import { createAccentTitle } from "../components/accentTitle.js";
import { createPlaceholderField } from "../components/authField.js";
import { navigateToVerifyEmailPending } from "./verifyEmailPending.js";

export function renderLogin(container) {
  container.replaceChildren();

  const form = document.createElement("form");
  form.id = "login-form";
  form.className = "auth-form";

  form.append(createAccentTitle("Connexion"));

  const emailInput = createPlaceholderField("email", "email", "Adresse e-mail", {
    autocomplete: "email",
  });
  const passwordInput = createPlaceholderField("password", "password", "Mot de passe", {
    autocomplete: "current-password",
  });

  const errorEl = document.createElement("p");
  errorEl.id = "login-error";
  errorEl.className = "error";
  errorEl.hidden = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn btn-primary btn-full";
  submitBtn.textContent = "Valider";

  const registerLink = document.createElement("p");
  registerLink.className = "auth-footer-link";
  registerLink.innerHTML = "Nouveau joueur ? <a href=\"/register\">Inscrivez-vous ici.</a>";
  registerLink.querySelector("a").addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/register");
  });

  const forgotLink = document.createElement("a");
  forgotLink.href = "/forgot-password";
  forgotLink.className = "auth-link-subtle";
  forgotLink.textContent = "Mot de passe oublié ?";
  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/forgot-password");
  });

  const privacyWrap = document.createElement("p");
  privacyWrap.className = "auth-privacy";
  privacyWrap.append(createPrivacyLink());

  form.append(
    emailInput,
    passwordInput,
    errorEl,
    submitBtn,
    registerLink,
    forgotLink,
    privacyWrap,
  );
  container.append(wrapAuthPage(form));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    try {
      const data = await login(emailInput.value.trim(), passwordInput.value);
      saveToken(data.token);
      navigateTo("/dashboard", { replace: true });
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED" && err.email) {
        navigateToVerifyEmailPending(err.email, { message: err.message });
        return;
      }
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}
