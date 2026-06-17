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

function renderUsersPanel(container, errorEl, reloadTabs) {
  container.replaceChildren();
  const loading = document.createElement("p");
  loading.textContent = "Chargement des utilisateurs…";
  container.append(loading);

  getAdminUsers()
    .then((data) => {
      container.replaceChildren();

      const notice = document.createElement("p");
      notice.className = "admin-privacy";
      notice.textContent = data.privacy_notice;
      container.append(notice);

      const table = document.createElement("table");
      table.className = "admin-table";

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      for (const label of [
        "Pseudo",
        "E-mail",
        "Rôle",
        "Statut",
        "Quiz",
        "Inscription",
        "Actions",
      ]) {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.append(th);
      }
      thead.append(headRow);
      table.append(thead);

      const tbody = document.createElement("tbody");

      for (const user of data.users) {
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
              const row = revealBtn.closest("tr");
              row.children[1].textContent = detail.user.email;
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
              reloadTabs();
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
              reloadTabs();
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
        tbody.append(tr);
      }

      table.append(tbody);
      container.append(table);
    })
    .catch((err) => {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      container.replaceChildren();
    });
}

function renderQuizzesPanel(container, errorEl, reloadTabs) {
  container.replaceChildren();
  const loading = document.createElement("p");
  loading.textContent = "Chargement des quiz…";
  container.append(loading);

  getAdminQuizzes()
    .then((data) => {
      container.replaceChildren();

      const table = document.createElement("table");
      table.className = "admin-table";

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      for (const label of [
        "Titre",
        "Auteur",
        "Publié",
        "Créé le",
        "Actions",
      ]) {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.append(th);
      }
      thead.append(headRow);
      table.append(thead);

      const tbody = document.createElement("tbody");

      for (const quiz of data.quizzes) {
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
              reloadTabs();
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
            reloadTabs();
          } catch (err) {
            errorEl.textContent = err.message;
            errorEl.hidden = false;
          }
        });

        actionsTd.append(deleteBtn);

        tr.append(titleTd, ownerTd, publishedTd, dateTd, actionsTd);
        tbody.append(tr);
      }

      table.append(tbody);
      container.append(table);
    })
    .catch((err) => {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      container.replaceChildren();
    });
}

export function renderAdmin(container) {
  container.replaceChildren();

  const section = document.createElement("section");
  section.className = "admin";

  const header = document.createElement("div");
  header.className = "admin-header";

  const title = document.createElement("h1");
  title.textContent = "Administration";

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.textContent = "Retour au dashboard";
  backBtn.addEventListener("click", () => navigateTo("/dashboard"));

  header.append(title, backBtn);

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

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  section.append(header, gdprNotice, privacyLink, tabs, panel, errorEl);
  container.append(section);

  let activeTab = "users";

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

    if (activeTab === "users") {
      renderUsersPanel(panel, errorEl, reloadTabs);
    } else {
      renderQuizzesPanel(panel, errorEl, reloadTabs);
    }
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
