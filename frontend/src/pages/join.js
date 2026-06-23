import { getToken } from "../services/api.js";
import { getSession } from "../services/api.js";
import { navigateTo, setActiveLobby } from "../utils/navigation.js";
import { showBlockedDialog } from "../utils/blockedDialog.js";

export function renderJoin(container, presetCode = "") {
  if (!getToken()) {
    navigateTo("/login");
    return;
  }

  container.replaceChildren();

  const form = document.createElement("form");
  form.className = "auth-form";

  const title = document.createElement("h1");
  title.textContent = "Rejoindre une partie";
  form.append(title);

  const hint = document.createElement("p");
  hint.className = "quiz-empty";
  hint.textContent = "Tu rejoindras la partie avec ton nom de compte.";
  form.append(hint);

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
  submitBtn.textContent = "Rejoindre";

  const backLink = document.createElement("a");
  backLink.href = "/dashboard";
  backLink.className = "auth-link";
  backLink.textContent = "Retour au dashboard";
  backLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/dashboard");
  });

  form.append(codeLabel, errorEl, submitBtn, backLink);
  container.append(form);

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
