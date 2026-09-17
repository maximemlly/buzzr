import { createSession, deleteQuiz } from "../services/api.js";
import { navigateTo, setActiveLobby } from "./navigation.js";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

export function createQuizRow(quiz, errorEl, onDeleted) {
  const row = document.createElement("li");
  row.className = "quiz-row";

  const info = document.createElement("div");
  info.className = "quiz-row-info";

  const head = document.createElement("div");
  head.className = "quiz-row-head";

  const name = document.createElement("h3");
  name.className = "quiz-row-name";
  name.textContent = quiz.title;

  const status = document.createElement("span");
  const isPublished = Boolean(quiz.is_published);
  status.className = isPublished ? "quiz-badge quiz-badge--public" : "quiz-badge quiz-badge--draft";
  status.textContent = isPublished ? "Public" : "Privé";
  head.append(name, status);

  const meta = document.createElement("p");
  meta.className = "quiz-row-meta";
  const count = Number(quiz.question_count ?? 0);
  const metaItems = [
    `${count} question${count > 1 ? "s" : ""}`,
    `Créé le ${formatDate(quiz.created_at)}`,
  ];
  for (const text of metaItems) {
    const item = document.createElement("span");
    item.textContent = text;
    meta.append(item);
  }
  if (count === 0) {
    const warn = document.createElement("span");
    warn.className = "quiz-row-meta-warn";
    warn.textContent = "Ajoutez une question pour pouvoir jouer";
    meta.append(warn);
  }

  info.append(head, meta);

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
  row.append(info, actions);
  return row;
}
