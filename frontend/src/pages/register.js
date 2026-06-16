import { register, resendVerification } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";

export function renderRegister(container) {
  container.replaceChildren();

  const form = document.createElement("form");
  form.id = "register-form";
  form.className = "auth-form";

  const title = document.createElement("h1");
  title.textContent = "Créer un compte";
  form.append(title);

  const usernameLabel = document.createElement("label");
  usernameLabel.textContent = "Nom d'utilisateur";
  const usernameInput = document.createElement("input");
  usernameInput.type = "text";
  usernameInput.name = "username";
  usernameInput.required = true;
  usernameInput.autocomplete = "username";
  usernameLabel.append(usernameInput);

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
  errorEl.id = "register-error";
  errorEl.className = "error";
  errorEl.hidden = true;

  const successEl = document.createElement("p");
  successEl.id = "register-success";
  successEl.className = "success";
  successEl.hidden = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "S'inscrire";

  const backLink = document.createElement("a");
  backLink.href = "/login";
  backLink.className = "auth-link";
  backLink.textContent = "Déjà un compte ? Se connecter";
  backLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/login");
  });

  form.append(
    usernameLabel,
    emailLabel,
    passwordLabel,
    confirmLabel,
    errorEl,
    successEl,
    submitBtn,
    backLink,
  );
  container.append(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    successEl.hidden = true;

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = confirmInput.value;

    if (password !== passwordConfirm) {
      errorEl.textContent = "Les mots de passe ne correspondent pas";
      errorEl.hidden = false;
      return;
    }

    try {
      const data = await register(username, email, password, passwordConfirm);
      form.replaceChildren();
      const doneTitle = document.createElement("h1");
      doneTitle.textContent = "Vérifiez votre e-mail";
      const doneText = document.createElement("p");
      doneText.textContent = data.message;
      const resendBtn = document.createElement("button");
      resendBtn.type = "button";
      resendBtn.textContent = "Renvoyer l'e-mail";
      resendBtn.addEventListener("click", async () => {
        resendBtn.disabled = true;
        try {
          const res = await resendVerification(email);
          doneText.textContent = res.message;
        } catch (err) {
          doneText.textContent = err.message;
        }
        resendBtn.disabled = false;
      });
      const loginLink = document.createElement("a");
      loginLink.href = "/login";
      loginLink.className = "auth-link";
      loginLink.textContent = "Aller à la connexion";
      loginLink.addEventListener("click", (ev) => {
        ev.preventDefault();
        navigateTo("/login");
      });
      form.append(doneTitle, doneText, resendBtn, loginLink);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}
