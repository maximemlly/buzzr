function getRankMessage(rank, totalPlayers, score) {
  if (rank === 1) {
    return {
      title: "Victoire !",
      subtitle: `Tu remportes la partie avec ${score} pts`,
      variant: "win",
    };
  }
  if (rank === 2) {
    return {
      title: "2ème place",
      subtitle: `Bravo ! Tu termines sur le podium avec ${score} pts`,
      variant: "second",
    };
  }
  if (rank === 3) {
    return {
      title: "3ème place",
      subtitle: `Tu es sur le podium avec ${score} pts`,
      variant: "third",
    };
  }
  return {
    title: `${rank}ème place`,
    subtitle: `${score} pts — sur ${totalPlayers} joueur${totalPlayers > 1 ? "s" : ""}`,
    variant: "other",
  };
}

export function renderGameResults(container, { leaderboard, username, isHost, onLeave }) {
  container.replaceChildren();

  const screen = document.createElement("section");
  screen.className = "results-screen";

  const winner = leaderboard[0] ?? null;

  let headline;
  let subline;
  let variant = "host";

  if (isHost) {
    headline = "Partie terminée";
    subline = winner
      ? `Vainqueur : ${winner.nickname} (${winner.score} pts)`
      : "Aucun joueur n'a marqué de points";
    variant = "host";
  } else {
    const rankIndex = leaderboard.findIndex((e) => e.nickname === username);
    const rank = rankIndex === -1 ? null : rankIndex + 1;
    const score = rankIndex === -1 ? 0 : leaderboard[rankIndex].score;

    if (rank === null) {
      headline = "Partie terminée";
      subline = "Tu n'étais pas dans le classement des joueurs";
      variant = "other";
    } else {
      const msg = getRankMessage(rank, leaderboard.length, score);
      headline = msg.title;
      subline = msg.subtitle;
      variant = msg.variant;
    }
  }

  const banner = document.createElement("div");
  banner.className = `results-banner results-${variant}`;

  const titleEl = document.createElement("h1");
  titleEl.textContent = headline;

  const subtitleEl = document.createElement("p");
  subtitleEl.className = "results-subtitle";
  subtitleEl.textContent = subline;

  banner.append(titleEl, subtitleEl);

  if (winner && !isHost) {
    const winnerHint = document.createElement("p");
    winnerHint.className = "results-winner-hint";
    winnerHint.textContent =
      username === winner.nickname
        ? "Tu es en tête du classement !"
        : `Vainqueur : ${winner.nickname} (${winner.score} pts)`;
    banner.append(winnerHint);
  }

  const podiumTitle = document.createElement("h2");
  podiumTitle.textContent = "Classement final";

  const podiumList = document.createElement("ol");
  podiumList.className = "results-podium";

  leaderboard.forEach((entry, index) => {
    const li = document.createElement("li");
    const rank = index + 1;
    li.className = "results-podium-item";

    if (rank === 1) li.classList.add("is-winner");
    if (!isHost && entry.nickname === username) li.classList.add("is-you");
    if (rank === 2) li.classList.add("is-second");
    if (rank === 3) li.classList.add("is-third");

    const rankEl = document.createElement("span");
    rankEl.className = "results-rank";
    rankEl.textContent = `#${rank}`;

    const nameEl = document.createElement("span");
    nameEl.className = "results-name";
    nameEl.textContent = entry.nickname;

    const scoreEl = document.createElement("span");
    scoreEl.className = "results-score";
    scoreEl.textContent = `${entry.score} pts`;

    li.append(rankEl, nameEl, scoreEl);
    podiumList.append(li);
  });

  const leaveBtn = document.createElement("button");
  leaveBtn.type = "button";
  leaveBtn.textContent = "Retour au dashboard";
  leaveBtn.addEventListener("click", onLeave);

  screen.append(banner, podiumTitle, podiumList, leaveBtn);
  container.append(screen);
}
