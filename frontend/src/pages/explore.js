import { getPublicQuizzes, createSession, getMe } from "../services/api.js";
import { navigateTo, setActiveLobby } from "../utils/navigation.js";
import { createAppPage } from "../components/appLayout.js";
import { createSectionTitle } from "../components/accentTitle.js";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

function createQuizCard(quiz, errorEl, currentUserId) {
  const card = document.createElement("article");
  card.className = "explore-card";

  const title = document.createElement("h2");
  title.textContent = quiz.title;

  const meta = document.createElement("p");
  meta.className = "explore-meta";
  meta.textContent = `Par ${quiz.author_username} · ${quiz.question_count} question${quiz.question_count > 1 ? "s" : ""} · ${formatDate(quiz.created_at)}`;

  const desc = document.createElement("p");
  desc.className = "explore-desc";
  desc.textContent = quiz.description?.trim() || "Aucune description.";

  const actions = document.createElement("div");
  actions.className = "explore-actions";

  const launchBtn = document.createElement("button");
  launchBtn.type = "button";
  launchBtn.className = "btn btn-launch";
  launchBtn.textContent = "Lancer une partie";
  launchBtn.addEventListener("click", async () => {
    launchBtn.disabled = true;
    try {
      const data = await createSession(quiz.id);
      sessionStorage.setItem("lobbyRole", "host");
      setActiveLobby(data.session.code);
      navigateTo(`/lobby/${data.session.code}`, { replace: true });
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      launchBtn.disabled = false;
    }
  });

  if (currentUserId && Number(quiz.author_id) === Number(currentUserId)) {
    const ownerNote = document.createElement("span");
    ownerNote.className = "explore-owner-note";
    ownerNote.textContent = "Votre quiz — vous ne pourrez pas marquer de points.";
    actions.append(ownerNote);
  }

  actions.append(launchBtn);
  card.append(title, meta, desc, actions);
  return card;
}

export function renderExplore(container) {
  container.replaceChildren();

  const { page, main } = createAppPage({ activeNav: "explore" });

  const panel = document.createElement("section");
  panel.className = "panel-card explore-panel";

  const panelTitle = createSectionTitle("Quiz publics");
  panel.append(panelTitle);

  const searchForm = document.createElement("form");
  searchForm.className = "explore-search";

  const searchLabel = document.createElement("label");
  searchLabel.textContent = "Rechercher";
  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Titre, description ou auteur…";
  searchInput.autocomplete = "off";
  searchLabel.append(searchInput);
  searchForm.append(searchLabel);

  const listEl = document.createElement("div");
  listEl.className = "explore-list";

  const footer = document.createElement("div");
  footer.className = "admin-load-footer";

  const statusEl = document.createElement("p");
  statusEl.className = "admin-load-status";
  statusEl.textContent = "Chargement…";

  const loadMoreBtn = document.createElement("button");
  loadMoreBtn.type = "button";
  loadMoreBtn.className = "admin-load-more";
  loadMoreBtn.textContent = "Charger plus";
  loadMoreBtn.hidden = true;

  footer.append(statusEl, loadMoreBtn);

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  panel.append(searchForm, listEl, footer, errorEl);
  main.append(panel);
  container.append(page);

  let offset = 0;
  let total = 0;
  let loading = false;
  let searchQuery = "";
  let searchTimer = null;
  let currentUserId = null;

  function updateStatus(loadedCount) {
    if (total === 0) {
      statusEl.textContent = searchQuery
        ? "Aucun quiz public ne correspond à votre recherche."
        : "Aucun quiz public pour l'instant.";
      loadMoreBtn.hidden = true;
      return;
    }

    statusEl.textContent = `${loadedCount} sur ${total} quiz affiché${loadedCount > 1 ? "s" : ""}`;
    const remaining = total - loadedCount;
    loadMoreBtn.hidden = remaining <= 0;
    loadMoreBtn.textContent =
      remaining > 0
        ? `Charger plus (${remaining} restant${remaining > 1 ? "s" : ""})`
        : "Charger plus";
  }

  async function loadNext({ reset = false } = {}) {
    if (loading) return;
    loading = true;
    loadMoreBtn.disabled = true;

    if (reset) {
      offset = 0;
      listEl.replaceChildren();
      statusEl.textContent = "Chargement…";
    }

    try {
      const data = await getPublicQuizzes({
        limit: PAGE_SIZE,
        offset,
        search: searchQuery,
      });

      total = data.total ?? 0;

      for (const quiz of data.quizzes) {
        listEl.append(createQuizCard(quiz, errorEl, currentUserId));
      }

      offset += data.quizzes.length;
      updateStatus(offset);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      if (offset === 0) {
        statusEl.textContent = "Impossible de charger les quiz.";
      }
    } finally {
      loading = false;
      loadMoreBtn.disabled = false;
    }
  }

  loadMoreBtn.addEventListener("click", () => loadNext());

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (searchTimer) clearTimeout(searchTimer);
    searchQuery = searchInput.value.trim();
    errorEl.hidden = true;
    loadNext({ reset: true });
  });

  searchInput.addEventListener("input", () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const nextQuery = searchInput.value.trim();
      if (nextQuery === searchQuery) return;
      searchQuery = nextQuery;
      errorEl.hidden = true;
      loadNext({ reset: true });
    }, SEARCH_DEBOUNCE_MS);
  });

  getMe()
    .then((data) => {
      currentUserId = data.user.id;
    })
    .catch(() => {})
    .finally(() => loadNext({ reset: true }));
}
