import { getMe, getQuizzes, deleteQuiz, createSession, clearToken } from "../services/api.js";
import { navigateTo, setActiveLobby } from "../utils/navigation.js";

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
      const titleText = document.createElement("span");
      titleText.textContent = quiz.title;
      title.append(titleText);

      if (quiz.is_published) {
        const badge = document.createElement("span");
        badge.className = "quiz-badge quiz-badge-public";
        badge.textContent = "Public";
        title.append(badge);
      }

      const actions = document.createElement("div");
      actions.className = "quiz-actions";

      const launchBtn = document.createElement("button");
      launchBtn.type = "button";
      launchBtn.className = "btn-launch";
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
      editBtn.textContent = "Modifier";
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

      actions.append(launchBtn, editBtn, deleteBtn);
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

  const joinBtn = document.createElement("button");
  joinBtn.type = "button";
  joinBtn.textContent = "Rejoindre une partie";
  joinBtn.addEventListener("click", () => navigateTo("/join"));

  const exploreBtn = document.createElement("button");
  exploreBtn.type = "button";
  exploreBtn.textContent = "Explorer les quiz publics";
  exploreBtn.addEventListener("click", () => navigateTo("/explore"));

  const listEl = document.createElement("ul");
  listEl.className = "quiz-list";

  const emptyEl = document.createElement("p");
  emptyEl.className = "quiz-empty";
  emptyEl.textContent = "Aucun quiz pour l'instant.";
  emptyEl.hidden = true;

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  const closedMsg = sessionStorage.getItem("lobbyClosedMessage");
  if (closedMsg) {
    errorEl.textContent = closedMsg;
    errorEl.hidden = false;
    sessionStorage.removeItem("lobbyClosedMessage");
  }

  section.append(greeting, createBtn, exploreBtn, joinBtn, listEl, emptyEl, errorEl);
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
}
