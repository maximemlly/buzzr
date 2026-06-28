import {
  getMe,
  updateProfile,
  changePassword,
  saveToken,
  clearToken,
} from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";
import { createAppPage } from "../components/appLayout.js";

export function renderAccountSettings(container) {
  container.replaceChildren();

  const { page, main } = createAppPage();

  const hero = document.createElement("section");
  hero.className = "hero";

  const title = document.createElement("h1");
  title.textContent = "Paramètres du compte";

  const sub = document.createElement("p");
  sub.className = "hero-sub";
  sub.textContent = "Gérez votre pseudo et votre mot de passe";

  hero.append(title, sub);

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "btn btn-secondary";
  backBtn.textContent = "← Retour au dashboard";
  backBtn.addEventListener("click", () => navigateTo("/dashboard"));

  const emailBlock = document.createElement("div");
  emailBlock.className = "account-settings-block";

  const emailTitle = document.createElement("h2");
  emailTitle.textContent = "Adresse e-mail";

  const emailHint = document.createElement("p");
  emailHint.className = "auth-hint";
  emailHint.textContent = "L'adresse e-mail ne peut pas être modifiée.";

  const emailValue = document.createElement("p");
  emailValue.className = "account-email-value";
  emailValue.textContent = "Chargement…";

  emailBlock.append(emailTitle, emailHint, emailValue);

  const usernameForm = document.createElement("form");
  usernameForm.className = "account-settings-block";

  const usernameTitle = document.createElement("h2");
  usernameTitle.textContent = "Pseudo";

  const usernameLabel = document.createElement("label");
  usernameLabel.textContent = "Nom d'utilisateur";
  const usernameInput = document.createElement("input");
  usernameInput.type = "text";
  usernameInput.required = true;
  usernameInput.minLength = 3;
  usernameInput.autocomplete = "username";
  usernameLabel.append(usernameInput);

  const usernameError = document.createElement("p");
  usernameError.className = "error";
  usernameError.hidden = true;

  const usernameSuccess = document.createElement("p");
  usernameSuccess.className = "success";
  usernameSuccess.hidden = true;

  const usernameSubmit = document.createElement("button");
  usernameSubmit.type = "submit";
  usernameSubmit.className = "btn btn-primary";
  usernameSubmit.textContent = "Enregistrer le pseudo";

  usernameForm.append(
    usernameTitle,
    usernameLabel,
    usernameError,
    usernameSuccess,
    usernameSubmit,
  );

  const passwordForm = document.createElement("form");
  passwordForm.className = "account-settings-block";

  const passwordTitle = document.createElement("h2");
  passwordTitle.textContent = "Mot de passe";

  const currentLabel = document.createElement("label");
  currentLabel.textContent = "Mot de passe actuel";
  const currentInput = document.createElement("input");
  currentInput.type = "password";
  currentInput.required = true;
  currentInput.autocomplete = "current-password";
  currentLabel.append(currentInput);

  const newLabel = document.createElement("label");
  newLabel.textContent = "Nouveau mot de passe";
  const newInput = document.createElement("input");
  newInput.type = "password";
  newInput.required = true;
  newInput.minLength = 8;
  newInput.autocomplete = "new-password";
  newLabel.append(newInput);

  const confirmLabel = document.createElement("label");
  confirmLabel.textContent = "Confirmer le nouveau mot de passe";
  const confirmInput = document.createElement("input");
  confirmInput.type = "password";
  confirmInput.required = true;
  confirmInput.minLength = 8;
  confirmInput.autocomplete = "new-password";
  confirmLabel.append(confirmInput);

  const passwordError = document.createElement("p");
  passwordError.className = "error";
  passwordError.hidden = true;

  const passwordSuccess = document.createElement("p");
  passwordSuccess.className = "success";
  passwordSuccess.hidden = true;

  const passwordSubmit = document.createElement("button");
  passwordSubmit.type = "submit";
  passwordSubmit.className = "btn btn-primary";
  passwordSubmit.textContent = "Changer le mot de passe";

  passwordForm.append(
    passwordTitle,
    currentLabel,
    newLabel,
    confirmLabel,
    passwordError,
    passwordSuccess,
    passwordSubmit,
  );

  main.append(hero, backBtn, emailBlock, usernameForm, passwordForm);
  container.append(page);

  getMe()
    .then((data) => {
      emailValue.textContent = data.user.email;
      usernameInput.value = data.user.username;
    })
    .catch(() => {
      clearToken();
      navigateTo("/login");
    });

  usernameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    usernameError.hidden = true;
    usernameSuccess.hidden = true;

    try {
      const data = await updateProfile(usernameInput.value.trim());
      if (data.token) {
        saveToken(data.token);
      }
      usernameSuccess.textContent = data.message;
      usernameSuccess.hidden = false;
    } catch (err) {
      usernameError.textContent = err.message;
      usernameError.hidden = false;
    }
  });

  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    passwordError.hidden = true;
    passwordSuccess.hidden = true;

    const newPassword = newInput.value;
    const newPasswordConfirm = confirmInput.value;

    if (newPassword !== newPasswordConfirm) {
      passwordError.textContent = "Les mots de passe ne correspondent pas";
      passwordError.hidden = false;
      return;
    }

    try {
      const data = await changePassword(
        currentInput.value,
        newPassword,
        newPasswordConfirm,
      );
      passwordSuccess.textContent = data.message;
      passwordSuccess.hidden = false;
      currentInput.value = "";
      newInput.value = "";
      confirmInput.value = "";
    } catch (err) {
      passwordError.textContent = err.message;
      passwordError.hidden = false;
    }
  });
}
