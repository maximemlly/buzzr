import { getQuizzes, clearToken } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";
import { createAppPage } from "../components/appLayout.js";
import { createSectionTitle } from "../components/accentTitle.js";
import { createQuizRow } from "../utils/quizUi.js";

async function loadQuizList(listEl, emptyEl, errorEl) {
  listEl.replaceChildren();
  errorEl.hidden = true;
  emptyEl.hidden = true;

  try {
    const data = await getQuizzes();

    if (data.quizzes.length === 0) {
      emptyEl.hidden = false;
      return;
    }

    for (const quiz of data.quizzes) {
      listEl.append(
        createQuizRow(quiz, errorEl, () => loadQuizList(listEl, emptyEl, errorEl)),
      );
    }
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  }
}

export function renderMyQuizzes(container) {
  container.replaceChildren();

  const { page, main } = createAppPage({ activeNav: "quizzes" });

  const layout = document.createElement("div");
  layout.className = "quizzes-layout";

  const panel = document.createElement("section");
  panel.className = "panel-card quizzes-panel";

  const title = createSectionTitle("Mes quiz");

  const listEl = document.createElement("ul");
  listEl.className = "quiz-rows";

  const emptyEl = document.createElement("p");
  emptyEl.className = "state-empty";
  emptyEl.textContent = "Aucun quiz pour l'instant.";
  emptyEl.hidden = true;

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  panel.append(title, listEl, emptyEl, errorEl);

  const createBtn = document.createElement("button");
  createBtn.type = "button";
  createBtn.className = "btn btn-primary btn-create-quiz";
  createBtn.innerHTML = '<span class="btn-create-icon" aria-hidden="true">+</span> Créer un quiz';
  createBtn.addEventListener("click", () => navigateTo("/quiz/new"));

  layout.append(panel, createBtn);
  main.append(layout);
  container.append(page);

  getQuizzes()
    .then(() => loadQuizList(listEl, emptyEl, errorEl))
    .catch(() => {
      clearToken();
      navigateTo("/login");
    });
}
