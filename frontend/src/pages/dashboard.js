import { getQuizzes, getGameHistory, clearToken } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";
import { createAppPage } from "../components/appLayout.js";
import { createSectionTitle } from "../components/accentTitle.js";

function createStatRow(label, value, { extraClass = "" } = {}) {
  const row = document.createElement("div");
  row.className = extraClass ? `stat-row ${extraClass}` : "stat-row";

  const labelEl = document.createElement("span");
  labelEl.className = "stat-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "stat-value";
  valueEl.textContent = String(value);

  row.append(labelEl, valueEl);
  return row;
}

function setRankBadge(badgeEl, rank) {
  badgeEl.textContent = rank;
  badgeEl.className = "stat-rank-badge";

  if (["F", "E", "D", "C", "B", "A", "S"].includes(rank)) {
    badgeEl.classList.add(`stat-rank-badge--${rank}`);
  }
}

function createRatingCard() {
  const card = document.createElement("div");
  card.className = "rating-card";
  card.dataset.rank = "F";

  const title = document.createElement("p");
  title.className = "rating-card-title";
  title.textContent = "Classement";

  const body = document.createElement("div");
  body.className = "rating-card-body";

  const eloBlock = document.createElement("div");
  eloBlock.className = "rating-card-metric";

  const eloLabel = document.createElement("span");
  eloLabel.className = "rating-card-label";
  eloLabel.textContent = "Elo";

  const eloValue = document.createElement("span");
  eloValue.className = "rating-card-elo";
  eloValue.textContent = "—";

  eloBlock.append(eloLabel, eloValue);

  const rankBlock = document.createElement("div");
  rankBlock.className = "rating-card-metric rating-card-metric--rank";

  const rankLabel = document.createElement("span");
  rankLabel.className = "rating-card-label";
  rankLabel.textContent = "Rang";

  const rankBadge = document.createElement("span");
  rankBadge.className = "stat-rank-badge stat-rank-badge--F";
  rankBadge.textContent = "F";

  rankBlock.append(rankLabel, rankBadge);
  body.append(eloBlock, rankBlock);
  card.append(title, body);

  return { card, eloValue, rankBadge };
}

function updateRatingCard({ card, eloValue, rankBadge }, elo, rank, isUnranked = false) {
  eloValue.textContent = isUnranked || elo == null ? "—" : String(elo);
  setRankBadge(rankBadge, rank);
  card.dataset.rank = rank;
  card.classList.toggle("rating-card--unranked", isUnranked);
}

function formatPlayedAt(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function createHistoryRow(entry) {
  const row = document.createElement("li");
  row.className = "history-row";

  const info = document.createElement("div");
  info.className = "history-row-info";

  const name = document.createElement("span");
  name.className = "history-row-quiz";
  name.textContent = entry.quiz_title;

  const date = document.createElement("span");
  date.className = "history-row-date";
  date.textContent = formatPlayedAt(entry.played_at);

  info.append(name, date);

  const scoreWrap = document.createElement("div");
  scoreWrap.className = "history-row-score-wrap";

  const score = document.createElement("span");
  score.className = "history-row-score";
  score.textContent = `${entry.score} pts`;

  scoreWrap.append(score);

  if (entry.is_perfect) {
    const badge = document.createElement("span");
    badge.className = "history-row-badge";
    badge.textContent = "Maîtrisé";
    scoreWrap.append(badge);
  }

  row.append(info, scoreWrap);
  return row;
}

export function renderDashboard(container) {
  container.replaceChildren();

  const { page, main } = createAppPage({ activeNav: "dashboard" });

  const layout = document.createElement("div");
  layout.className = "dashboard-layout";

  const statsPanel = document.createElement("aside");
  statsPanel.className = "panel-card stats-panel";

  const statsTitle = createSectionTitle("Statistiques");
  const statsList = document.createElement("div");
  statsList.className = "stats-list";

  const statRows = {
    created: createStatRow("Quiz créés", 0),
    played: createStatRow("Parties jouées", 0),
    mastered: createStatRow("Quiz maîtrisés", 0),
    victories: createStatRow("Victoires", 0),
    successRate: createStatRow("Taux de réussite", "—"),
    streak: createStatRow("Série en cours", 0),
    best: createStatRow("Meilleur score", 0),
  };
  statsList.append(
    statRows.created,
    statRows.played,
    statRows.mastered,
    statRows.victories,
    statRows.successRate,
    statRows.streak,
    statRows.best,
  );

  const ratingCard = createRatingCard();

  statsPanel.append(statsTitle, statsList, ratingCard.card);

  const mainCol = document.createElement("div");
  mainCol.className = "dashboard-main";

  const historyPanel = document.createElement("section");
  historyPanel.className = "panel-card history-panel";

  const historyTitle = createSectionTitle("Historique");
  const historyHint = document.createElement("p");
  historyHint.className = "history-hint";
  historyHint.textContent = "Vos 5 dernières parties";

  const historyList = document.createElement("ul");
  historyList.className = "history-list";

  const emptyEl = document.createElement("p");
  emptyEl.className = "state-empty";
  emptyEl.textContent = "Aucune partie jouée pour l'instant.";
  emptyEl.hidden = true;

  historyPanel.append(historyTitle, historyHint, historyList, emptyEl);

  const joinBtn = document.createElement("button");
  joinBtn.type = "button";
  joinBtn.className = "btn btn-primary btn-join";
  joinBtn.innerHTML = '<span class="btn-join-icon" aria-hidden="true">👤</span> Rejoindre une partie';
  joinBtn.addEventListener("click", () => navigateTo("/join"));

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  const closedMsg = sessionStorage.getItem("lobbyClosedMessage");
  if (closedMsg) {
    errorEl.textContent = closedMsg;
    errorEl.hidden = false;
    sessionStorage.removeItem("lobbyClosedMessage");
  }

  mainCol.append(historyPanel, joinBtn, errorEl);
  layout.append(statsPanel, mainCol);
  main.append(layout);
  container.append(page);

  Promise.all([getQuizzes(), getGameHistory(5)])
    .then(([quizzesData, historyData]) => {
      const { stats } = historyData;

      statRows.created.querySelector(".stat-value").textContent = String(
        quizzesData.quizzes.length,
      );
      statRows.played.querySelector(".stat-value").textContent = String(stats.games_played);
      statRows.mastered.querySelector(".stat-value").textContent = String(stats.quizzes_mastered);
      statRows.victories.querySelector(".stat-value").textContent = String(stats.victories);
      statRows.successRate.querySelector(".stat-value").textContent =
        stats.success_rate == null ? "—" : `${stats.success_rate} %`;
      statRows.streak.querySelector(".stat-value").textContent = String(stats.win_streak);
      statRows.best.querySelector(".stat-value").textContent = String(stats.best_score);

      updateRatingCard(
        ratingCard,
        stats.elo_rating,
        stats.rank,
        stats.is_unranked,
      );

      historyList.replaceChildren();
      if (historyData.history.length === 0) {
        emptyEl.hidden = false;
        return;
      }

      emptyEl.hidden = true;
      for (const entry of historyData.history) {
        historyList.append(createHistoryRow(entry));
      }
    })
    .catch(() => {
      clearToken();
      navigateTo("/login");
    });
}
