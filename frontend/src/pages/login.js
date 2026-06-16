import { login, saveToken, resendVerification } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";

export function renderLogin(container) {
  container.replaceChildren();

  const form = document.createElement("form");
  form.id = "login-form";
  form.className = "auth-form";

  const title = document.createElement("h1");
  title.textContent = "Connexion";
  form.append(title);

  const emailLabel = document.createElement("label");
  emailLabel.textContent = "Adresse e-mail";
  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.name = "email";
  emailInput.required = true;
  emailInput.autocomplete = "email";
  emailLabel.append(emailInput);

  const passwordLabel = document.createElement("label");
  passwordLabel.textContent = "Mot de passe";
  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.name = "password";
  passwordInput.required = true;
  passwordInput.autocomplete = "current-password";
  passwordLabel.append(passwordInput);

  const errorEl = document.createElement("p");
  errorEl.id = "login-error";
  errorEl.className = "error";
  errorEl.hidden = true;

  const resendEl = document.createElement("p");
  resendEl.className = "auth-hint";
  resendEl.hidden = true;

  const resendBtn = document.createElement("button");
  resendBtn.type = "button";
  resendBtn.textContent = "Renvoyer l'e-mail de vérification";
  resendBtn.hidden = true;
  resendBtn.addEventListener("click", async () => {
    resendBtn.disabled = true;
    try {
      const data = await resendVerification(emailInput.value.trim());
      resendEl.textContent = data.message;
      resendEl.hidden = false;
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
    resendBtn.disabled = false;
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Se connecter";

  const forgotLink = document.createElement("a");
  forgotLink.href = "/forgot-password";
  forgotLink.className = "auth-link";
  forgotLink.textContent = "Mot de passe oublié ?";
  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/forgot-password");
  });

  const registerLink = document.createElement("a");
  registerLink.href = "/register";
  registerLink.className = "auth-link";
  registerLink.textContent = "Pas encore de compte ? S'inscrire";
  registerLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/register");
  });

  form.append(
    emailLabel,
    passwordLabel,
    errorEl,
    resendEl,
    resendBtn,
    submitBtn,
    forgotLink,
    registerLink,
  );
  container.append(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    resendEl.hidden = true;
    resendBtn.hidden = true;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      const data = await login(email, password);
      saveToken(data.token);
      navigateTo("/dashboard", { replace: true });
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      if (err.code === "EMAIL_NOT_VERIFIED") {
        resendBtn.hidden = false;
      }
    }
  });
}