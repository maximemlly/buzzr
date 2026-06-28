import { createSession, deleteQuiz } from "../services/api.js";
import { navigateTo, setActiveLobby } from "./navigation.js";

export function createQuizRow(quiz, errorEl, onDeleted) {
  const row = document.createElement("li");
  row.className = "quiz-row";

  const name = document.createElement("span");
  name.className = "quiz-row-name";
  name.textContent = quiz.title;

  const actions = document.createElement("div");
  actions.className = "quiz-row-actions";

  const launchBtn = document.createElement("button");
  launchBtn.type = "button";
  launchBtn.className = "btn btn-launch";
  launchBtn.textContent = "Lancer une partie";
  launchBtn.addEventListener("click", async () => {
    try {
      const data = await createSession(quiz.id);
      sessionStorage.setItem("lobbyRole", "host");
      setActiveLobby(data.session.code);
      navigateTo(`/lobby/${data.session.code}`, { replace: true });
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn btn-edit";
  editBtn.textContent = "Modifier";
  editBtn.addEventListener("click", () => navigateTo(`/quiz/${quiz.id}/edit`));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-danger";
  deleteBtn.textContent = "Supprimer";
  deleteBtn.addEventListener("click", async () => {
    if (!confirm(`Supprimer le quiz « ${quiz.title} » ?`)) return;
    try {
      await deleteQuiz(quiz.id);
      onDeleted?.();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });

  actions.append(launchBtn, editBtn, deleteBtn);
  row.append(name, actions);
  return row;
}
