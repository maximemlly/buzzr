import {
  getMe,
  getAdminUsers,
  getAdminUser,
  setAdminUserStatus,
  eraseAdminUser,
  getAdminQuizzes,
  unpublishAdminQuiz,
  deleteAdminQuiz,
  clearToken,
} from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";
import { createPrivacyLink } from "../components/privacyLink.js";
import { createAppPage } from "../components/appLayout.js";

const PAGE_SIZE = 20;

function createTabButton(label, isActive, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = isActive ? "admin-tab active" : "admin-tab";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

function createTable(columns) {
  const table = document.createElement("table");
  table.className = "admin-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of columns) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.append(th);
  }
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  table.append(tbody);

  return { table, tbody };
}

function createUserRow(user, errorEl, onModeration) {
  const tr = document.createElement("tr");

  const cells = [
    user.username,
    user.email,
    user.role,
    user.is_active ? "Actif" : "Désactivé",
    String(user.quiz_count),
    formatDate(user.created_at),
  ];

  for (const text of cells) {
    const td = document.createElement("td");
    td.textContent = text;
    tr.append(td);
  }

  const actionsTd = document.createElement("td");
  actionsTd.className = "admin-actions";

  if (user.role !== "admin") {
    const revealBtn = document.createElement("button");
    revealBtn.type = "button";
    revealBtn.textContent = "Voir e-mail";
    revealBtn.addEventListener("click", async () => {
      try {
        const detail = await getAdminUser(user.id);
        tr.children[1].textContent = detail.user.email;
        revealBtn.disabled = true;
        revealBtn.textContent = "Consulté";
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    });

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.textContent = user.is_active ? "Désactiver" : "Réactiver";
    toggleBtn.addEventListener("click", async () => {
      const action = user.is_active ? "désactiver" : "réactiver";
      if (!confirm(`${action} le compte « ${user.username} » ?`)) return;

      try {
        await setAdminUserStatus(user.id, !user.is_active);
        onModeration();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    });

    const eraseBtn = document.createElement("button");
    eraseBtn.type = "button";
    eraseBtn.className = "btn-danger";
    eraseBtn.textContent = "Anonymiser";
    eraseBtn.addEventListener("click", async () => {
      if (
        !confirm(
          `Anonymiser définitivement « ${user.username} » ?\n\nLes données personnelles seront effacées (RGPD art. 17). Cette action est irréversible.`,
        )
      ) {
        return;
      }

      try {
        await eraseAdminUser(user.id);
        onModeration();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    });

    actionsTd.append(revealBtn, toggleBtn, eraseBtn);
  } else {
    const span = document.createElement("span");
    span.className = "admin-muted";
    span.textContent = "—";
    actionsTd.append(span);
  }

  tr.append(actionsTd);
  return tr;
}

function createQuizRow(quiz, errorEl, onModeration) {
  const tr = document.createElement("tr");

  const titleTd = document.createElement("td");
  titleTd.textContent = quiz.title;

  const ownerTd = document.createElement("td");
  ownerTd.textContent = quiz.owner_username;

  const publishedTd = document.createElement("td");
  publishedTd.textContent = quiz.is_published ? "Oui" : "Non";

  const dateTd = document.createElement("td");
  dateTd.textContent = formatDate(quiz.created_at);

  const actionsTd = document.createElement("td");
  actionsTd.className = "admin-actions";

  if (quiz.is_published) {
    const unpublishBtn = document.createElement("button");
    unpublishBtn.type = "button";
    unpublishBtn.textContent = "Dépublier";
    unpublishBtn.addEventListener("click", async () => {
      if (!confirm(`Dépublier le quiz « ${quiz.title} » ?`)) return;

      try {
        await unpublishAdminQuiz(quiz.id);
        onModeration();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    });
    actionsTd.append(unpublishBtn);
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn-danger";
  deleteBtn.textContent = "Supprimer";
  deleteBtn.addEventListener("click", async () => {
    if (!confirm(`Supprimer définitivement le quiz « ${quiz.title} » ?`)) return;

    try {
      await deleteAdminQuiz(quiz.id);
      onModeration();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });

  actionsTd.append(deleteBtn);
  tr.append(titleTd, ownerTd, publishedTd, dateTd, actionsTd);
  return tr;
}

function setupPaginatedPanel(container, errorEl, { columns, fetchPage, renderRow, topContent }) {
  container.replaceChildren();

  if (topContent) {
    container.append(topContent);
  }

  const statusEl = document.createElement("p");
  statusEl.className = "admin-load-status";
  statusEl.textContent = "Chargement…";

  const { table, tbody } = createTable(columns);
  const footer = document.createElement("div");
  footer.className = "admin-load-footer";

  const loadMoreBtn = document.createElement("button");
  loadMoreBtn.type = "button";
  loadMoreBtn.className = "admin-load-more";
  loadMoreBtn.textContent = "Charger plus";
  loadMoreBtn.hidden = true;

  footer.append(statusEl, loadMoreBtn);
  container.append(table, footer);

  let offset = 0;
  let total = 0;
  let loading = false;

  function updateStatus(loadedCount) {
    if (total === 0) {
      statusEl.textContent = "Aucun élément à afficher.";
      return;
    }

    statusEl.textContent = `${loadedCount} sur ${total} affiché${loadedCount > 1 ? "s" : ""}`;
    const remaining = total - loadedCount;
    loadMoreBtn.hidden = remaining <= 0;
    loadMoreBtn.textContent =
      remaining > 0 ? `Charger plus (${remaining} restant${remaining > 1 ? "s" : ""})` : "Charger plus";
  }

  async function loadNext({ reset = false } = {}) {
    if (loading) return;
    loading = true;
    loadMoreBtn.disabled = true;

    if (reset) {
      offset = 0;
      tbody.replaceChildren();
      statusEl.textContent = "Chargement…";
    }

    try {
      const data = await fetchPage({ limit: PAGE_SIZE, offset });
      const items = data.items ?? [];

      total = data.total ?? 0;
      for (const item of items) {
        tbody.append(renderRow(item));
      }

      offset += items.length;
      updateStatus(offset);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      if (offset === 0) {
        statusEl.textContent = "Impossible de charger les données.";
      }
    } finally {
      loading = false;
      loadMoreBtn.disabled = false;
    }
  }

  loadMoreBtn.addEventListener("click", () => loadNext());

  loadNext({ reset: true });

  return { reload: () => loadNext({ reset: true }) };
}

function renderUsersPanel(container, errorEl, onModeration) {
  const notice = document.createElement("p");
  notice.className = "admin-privacy";

  return setupPaginatedPanel(container, errorEl, {
    columns: ["Pseudo", "E-mail", "Rôle", "Statut", "Quiz", "Inscription", "Actions"],
    topContent: notice,
    fetchPage: async ({ limit, offset }) => {
      const data = await getAdminUsers({ limit, offset });
      notice.textContent = data.privacy_notice;
      return { items: data.users, total: data.total };
    },
    renderRow: (user) => createUserRow(user, errorEl, onModeration),
  });
}

function renderQuizzesPanel(container, errorEl, onModeration) {
  return setupPaginatedPanel(container, errorEl, {
    columns: ["Titre", "Auteur", "Publié", "Créé le", "Actions"],
    fetchPage: async ({ limit, offset }) => {
      const data = await getAdminQuizzes({ limit, offset });
      return { items: data.quizzes, total: data.total };
    },
    renderRow: (quiz) => createQuizRow(quiz, errorEl, onModeration),
  });
}

export function renderAdmin(container) {
  container.replaceChildren();

  const { page, main } = createAppPage();

  const hero = document.createElement("section");
  hero.className = "hero";

  const title = document.createElement("h1");
  title.textContent = "Administration";

  const sub = document.createElement("p");
  sub.className = "hero-sub";
  sub.textContent = "Modération des utilisateurs et des quiz publics";

  hero.append(title, sub);

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "btn btn-secondary";
  backBtn.textContent = "← Retour au dashboard";
  backBtn.addEventListener("click", () => navigateTo("/dashboard"));

  const gdprNotice = document.createElement("p");
  gdprNotice.className = "admin-privacy";
  gdprNotice.textContent =
    "Espace réservé à la modération. Données limitées au strict nécessaire, e-mails masqués par défaut, actions tracées. Ne consultez les données personnelles qu'en cas de besoin légitime.";

  const privacyLink = createPrivacyLink();
  privacyLink.className = "auth-link admin-privacy-link";

  const tabs = document.createElement("div");
  tabs.className = "admin-tabs";

  const panel = document.createElement("div");
  panel.className = "admin-panel";

  const adminWrap = document.createElement("div");
  adminWrap.className = "admin";

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  adminWrap.append(gdprNotice, privacyLink, tabs, panel, errorEl);
  main.append(hero, backBtn, adminWrap);
  container.append(page);

  let activeTab = "users";
  let panelController = null;

  function reloadTabs() {
    errorEl.hidden = true;
    tabs.replaceChildren();

    const usersTab = createTabButton("Utilisateurs", activeTab === "users", () => {
      activeTab = "users";
      reloadTabs();
    });

    const quizzesTab = createTabButton("Quiz", activeTab === "quizzes", () => {
      activeTab = "quizzes";
      reloadTabs();
    });

    tabs.append(usersTab, quizzesTab);

    const onModeration = () => panelController?.reload();

    panelController =
      activeTab === "users"
        ? renderUsersPanel(panel, errorEl, onModeration)
        : renderQuizzesPanel(panel, errorEl, onModeration);
  }

  getMe()
    .then((data) => {
      if (data.user.role !== "admin") {
        navigateTo("/dashboard", { replace: true });
        return;
      }
      reloadTabs();
    })
    .catch(() => {
      clearToken();
      navigateTo("/login");
    });
}
