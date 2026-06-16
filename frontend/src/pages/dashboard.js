import { getMe, getQuizzes, deleteQuiz, clearToken } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";

async function loadQuizzes(listEl, emptyEl, errorEl) {
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
      const li = document.createElement("li");

      const title = document.createElement("span");
      title.className = "quiz-title";
      title.textContent = quiz.title;

      const actions = document.createElement("div");
      actions.className = "quiz-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "Éditer";
      editBtn.addEventListener("click", () => {
        navigateTo(`/quiz/${quiz.id}/edit`);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-danger";
      deleteBtn.textContent = "Supprimer";
      deleteBtn.addEventListener("click", async () => {
        if (!confirm(`Supprimer le quiz « ${quiz.title} » ?`)) return;

        try {
          await deleteQuiz(quiz.id);
          await loadQuizzes(listEl, emptyEl, errorEl);
        } catch (err) {
          errorEl.textContent = err.message;
          errorEl.hidden = false;
        }
      });

      actions.append(editBtn, deleteBtn);
      li.append(title, actions);
      listEl.append(li);
    }
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  }
}

export function renderDashboard(container) {
  container.replaceChildren();

  const section = document.createElement("section");
  section.className = "dashboard";

  const greeting = document.createElement("h1");
  greeting.textContent = "Chargement…";

  const createBtn = document.createElement("button");
  createBtn.type = "button";
  createBtn.textContent = "Créer un quiz";
  createBtn.addEventListener("click", () => navigateTo("/quiz/new"));

  const listEl = document.createElement("ul");
  listEl.className = "quiz-list";

  const emptyEl = document.createElement("p");
  emptyEl.className = "quiz-empty";
  emptyEl.textContent = "Aucun quiz pour l'instant.";
  emptyEl.hidden = true;

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.textContent = "Déconnexion";

  section.append(greeting, createBtn, listEl, emptyEl, errorEl, logoutBtn);
  container.append(section);

  getMe()
    .then((data) => {
      greeting.textContent = `Bonjour, ${data.user.username} !`;
      return loadQuizzes(listEl, emptyEl, errorEl);
    })
    .catch(() => {
      clearToken();
      navigateTo("/login");
    });

  logoutBtn.addEventListener("click", () => {
    clearToken();
    navigateTo("/login");
  });
}
