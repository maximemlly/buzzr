import { getToken } from "../services/api.js";
import { getSession } from "../services/api.js";
import { navigateTo, setActiveLobby } from "../utils/navigation.js";
import { showBlockedDialog } from "../utils/blockedDialog.js";
import { createAppPage } from "../components/appLayout.js";
import { createBackLink } from "../components/backLink.js";

export function renderJoin(container, presetCode = "") {
  if (!getToken()) {
    navigateTo("/login");
    return;
  }

  container.replaceChildren();

  const { page, main } = createAppPage({ showNav: false });
  main.classList.add("app-main--centered");

  const hero = document.createElement("section");
  hero.className = "hero";

  const title = document.createElement("h1");
  title.textContent = "Rejoindre une partie";

  const hint = document.createElement("p");
  hint.className = "hero-sub";
  hint.textContent = "Entrez le code à 6 caractères partagé par l'hôte";

  hero.append(title, hint);

  const form = document.createElement("form");
  form.className = "panel-form";

  const codeLabel = document.createElement("label");
  codeLabel.textContent = "Code de la partie";
  const codeInput = document.createElement("input");
  codeInput.type = "text";
  codeInput.maxLength = 6;
  codeInput.required = true;
  codeInput.value = presetCode;
  codeInput.autocomplete = "off";
  codeLabel.append(codeInput);

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn btn-primary btn-full";
  submitBtn.textContent = "Rejoindre la partie";

  const backLink = createBackLink();

  form.append(codeLabel, errorEl, submitBtn);
  main.append(backLink, hero, form);
  container.append(page);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const code = codeInput.value.trim().toUpperCase();

    try {
      await getSession(code);
      sessionStorage.removeItem("lobbyRole");
      setActiveLobby(code);
      navigateTo(`/lobby/${code}`, { replace: true });
    } catch (err) {
      if (err.code === "QUIZ_OWNER_CANNOT_PLAY") {
        showBlockedDialog(err.message);
        return;
      }
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}
