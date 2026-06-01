import { register, saveToken } from "../services/api.js";
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
  passwordInput.autocomplete = "new-password";
  passwordLabel.append(passwordInput);

  const errorEl = document.createElement("p");
  errorEl.id = "register-error";
  errorEl.className = "error";
  errorEl.hidden = true;

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
    errorEl,
    submitBtn,
    backLink,
  );
  container.append(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      const data = await register(username, email, password);
      saveToken(data.token);
      navigateTo("/dashboard");
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}
