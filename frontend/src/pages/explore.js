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

  const head = document.createElement("div");
  head.className = "explore-card-head";

  const title = document.createElement("h2");
  title.textContent = quiz.title;
  head.append(title);

  const isOwner = currentUserId && Number(quiz.author_id) === Number(currentUserId);
  if (isOwner) {
    const badge = document.createElement("span");
    badge.className = "explore-badge";
    badge.textContent = "Votre quiz";
    head.append(badge);
  }

  const meta = document.createElement("p");
  meta.className = "explore-meta";
  const metaItems = [
    `Par ${quiz.author_username}`,
    `${quiz.question_count} question${quiz.question_count > 1 ? "s" : ""}`,
    formatDate(quiz.created_at),
  ];
  for (const text of metaItems) {
    const item = document.createElement("span");
    item.textContent = text;
    meta.append(item);
  }

  const desc = document.createElement("p");
  desc.className = "explore-desc";
  desc.textContent = quiz.description?.trim() || "Aucune description.";
  if (!quiz.description?.trim()) desc.classList.add("explore-desc--empty");

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

  if (isOwner) {
    const ownerNote = document.createElement("span");
    ownerNote.className = "explore-owner-note";
    ownerNote.textContent = "Vous ne pourrez pas marquer de points sur votre propre quiz.";
    actions.append(ownerNote);
  }

  actions.append(launchBtn);
  card.append(head, meta, desc, actions);
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

  searchForm.setAttribute("role", "search");

  const searchLabel = document.createElement("label");
  searchLabel.className = "sr-only";
  searchLabel.htmlFor = "explore-search-input";
  searchLabel.textContent = "Rechercher un quiz public";

  const searchField = document.createElement("div");
  searchField.className = "explore-search-field";
  searchField.innerHTML =
    '<svg class="explore-search-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="9" r="5.5"/><path d="m13.5 13.5 3.5 3.5"/></svg>';

  const searchInput = document.createElement("input");
  searchInput.id = "explore-search-input";
  searchInput.type = "search";
  searchInput.placeholder = "Rechercher par titre, description ou auteur…";
  searchInput.autocomplete = "off";
  searchField.append(searchInput);
  searchForm.append(searchLabel, searchField);

  const listEl = document.createElement("div");
  listEl.className = "explore-list";

  const footer = document.createElement("div");
  footer.className = "admin-load-footer";

  const statusEl = document.createElement("p");
  statusEl.className = "admin-load-status explore-status";
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
    statusEl.classList.toggle("explore-status--empty", total === 0);
    if (total === 0) {
      statusEl.textContent = searchQuery
        ? `Aucun quiz public ne correspond à « ${searchQuery} ».`
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
