import { getMe } from "../services/api.js";
import { connectSocket, disconnectSocket } from "../services/socket.js";
import { navigateTo, setActiveLobby, leaveLobby, clearLobbySession } from "../utils/navigation.js";
import { renderGameResults, fillPodiumList } from "../components/gameResults.js";
import { showBlockedDialog } from "../utils/blockedDialog.js";
import { createAppPage } from "../components/appLayout.js";

function renderLobbyPlayers(listEl, hostBannerEl, { host, participants }) {
  hostBannerEl.replaceChildren();
  hostBannerEl.hidden = true;
  listEl.replaceChildren();

  if (host && !host.canPlay) {
    hostBannerEl.hidden = false;
    const badge = document.createElement("p");
    badge.className = "lobby-host-banner";

    const crown = document.createElement("span");
    crown.className = "lobby-crown";
    crown.textContent = "👑";
    crown.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = `Hôte de la partie : ${host.nickname}`;

    badge.append(crown, label);
    hostBannerEl.append(badge);
  }

  if (!participants.length) {
    const empty = document.createElement("p");
    empty.className = "quiz-empty";
    if (host?.canPlay) {
      empty.textContent = "Vous êtes prêt — en attente d'autres joueurs…";
    } else {
      empty.textContent = "En attente de joueurs…";
    }
    listEl.append(empty);
    return;
  }

  for (const player of participants) {
    const li = document.createElement("li");
    li.className = "lobby-player-item";

    if (player.isPlayingHost) {
      const crown = document.createElement("span");
      crown.className = "lobby-crown";
      crown.textContent = "👑";
      crown.setAttribute("aria-label", "Hôte");

      const name = document.createElement("span");
      name.textContent = player.nickname;

      const tag = document.createElement("span");
      tag.className = "lobby-host-tag";
      tag.textContent = "Hôte";

      li.append(crown, name, tag);
    } else {
      li.textContent = player.nickname;
    }

    listEl.append(li);
  }
}

function renderLeaderboard(listEl, leaderboard, { username, isHostViewer }) {
  fillPodiumList(listEl, leaderboard, { username, isHostViewer });
}

export function renderLobby(container, code) {
  container.replaceChildren();
  disconnectSocket();
  const socket = connectSocket();

  const isHostHint = sessionStorage.getItem("lobbyRole") === "host";
  let isHost = false;
  let hostCanPlay = false;

  const { page, main } = createAppPage({ showNav: false });

  const hero = document.createElement("section");
  hero.className = "hero";

  const title = document.createElement("h1");
  title.textContent = `Lobby — ${code}`;

  const statusEl = document.createElement("p");
  statusEl.className = "hero-sub";
  statusEl.textContent = "Connexion…";

  hero.append(title, statusEl);

  const lobbyPanel = document.createElement("div");
  lobbyPanel.className = "lobby-panel";

  const waitingBlock = document.createElement("div");
  waitingBlock.className = "waiting-block";

  const participantsTitle = document.createElement("h2");
  participantsTitle.textContent = "Joueurs connectés";

  const hostBannerEl = document.createElement("div");
  hostBannerEl.className = "lobby-host-banner-wrap";
  hostBannerEl.hidden = true;

  const participantsList = document.createElement("ul");
  participantsList.className = "quiz-list";

  waitingBlock.append(participantsTitle, hostBannerEl, participantsList);

  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.className = "btn btn-launch";
  startBtn.textContent = "Démarrer la partie";
  startBtn.hidden = true;

  const gameArea = document.createElement("div");
  gameArea.className = "game-area";
  gameArea.hidden = true;

  const questionLabel = document.createElement("h2");
  const timerEl = document.createElement("p");
  timerEl.id = "game-timer";
  const answersEl = document.createElement("div");
  answersEl.className = "answers-grid";

  const resultEl = document.createElement("p");
  resultEl.className = "quiz-empty";
  resultEl.hidden = true;

  const scoreBlock = document.createElement("div");
  scoreBlock.className = "score-block";
  scoreBlock.hidden = true;

  const scoreTitle = document.createElement("h2");
  scoreTitle.textContent = "Classement";

  const scoreMessageEl = document.createElement("p");
  scoreMessageEl.className = "scores-interim-message";
  scoreMessageEl.hidden = true;

  const scoreList = document.createElement("ol");
  scoreList.className = "results-podium";

  scoreBlock.append(scoreTitle, scoreMessageEl, scoreList);

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "btn btn-secondary";
  backBtn.textContent = "Quitter la partie";
  backBtn.addEventListener("click", leaveGame);

  gameArea.append(questionLabel, timerEl, answersEl, resultEl);
  lobbyPanel.append(waitingBlock, startBtn, gameArea, scoreBlock, backBtn);
  main.append(hero, lobbyPanel);
  container.append(page);

  let timerInterval = null;
  let hasAnswered = false;
  let currentUsername = "";

  function setScoresLayout(active) {
    hero.hidden = active;
    backBtn.hidden = active;
    startBtn.hidden = true;
    waitingBlock.hidden = true;
    gameArea.hidden = true;
    scoreBlock.hidden = !active;
    scoreMessageEl.hidden = !active;
    main.classList.toggle("app-main--centered", active);
    page.classList.toggle("lobby-scores-view", active);
  }

  function leaveGame() {
    socket.emit("leave_lobby");
    disconnectSocket();
    leaveLobby("/dashboard");
  }

  function clearTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateStartButton() {
    startBtn.hidden = !isHost || !gameArea.hidden;
  }

  function showWaiting() {
    setScoresLayout(false);
    waitingBlock.hidden = false;
    gameArea.hidden = true;
    updateStartButton();
  }

  function showQuestion(data) {
    setScoresLayout(false);
    waitingBlock.hidden = true;
    gameArea.hidden = false;
    updateStartButton();
    resultEl.hidden = true;
    answersEl.replaceChildren();
    hasAnswered = false;

    questionLabel.textContent = `Question ${data.index + 1}/${data.total} — ${data.question.label}`;

    const duration = data.question.timer_seconds ?? 20;
    let remaining = duration;
    timerEl.textContent = `Temps restant : ${remaining}s`;

    clearTimer();
    timerInterval = setInterval(() => {
      remaining -= 1;
      timerEl.textContent = `Temps restant : ${remaining}s`;
      if (remaining <= 0) clearTimer();
    }, 1000);

    if (!isHost || hostCanPlay) {
      for (const answer of data.question.answers) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "answer-btn";
        btn.textContent = answer.label;
        btn.addEventListener("click", () => {
          if (hasAnswered) return;
          hasAnswered = true;
          socket.emit("submit_answer", { answerId: answer.id });
          [...answersEl.children].forEach((child) => {
            child.disabled = true;
          });
          timerEl.textContent = "Réponse enregistrée — en attente des autres…";
        });
        answersEl.append(btn);
      }
    } else {
      const hostMsg = document.createElement("p");
      hostMsg.className = "quiz-empty";
      hostMsg.textContent = "Vous animez la partie — les joueurs répondent sur leur écran…";
      answersEl.append(hostMsg);
    }
  }

  function showScores(leaderboard, message) {
    setScoresLayout(true);
    scoreMessageEl.textContent = message;
    scoreTitle.textContent =
      isHost && !hostCanPlay ? "Classement des joueurs" : "Classement";
    renderLeaderboard(scoreList, leaderboard, {
      username: currentUsername,
      isHostViewer: isHost && !hostCanPlay,
    });
  }

  function expelFromLobby(message, { title = "Accès refusé", variant = "error" } = {}) {
    clearTimer();
    disconnectSocket();
    clearLobbySession();
    showBlockedDialog(message, {
      title,
      variant,
      onClose: () => navigateTo("/dashboard", { replace: true }),
    });
  }

  socket.on("session_joined", ({ isHost: hostRole }) => {
    isHost = Boolean(hostRole);
    if (isHost) {
      sessionStorage.setItem("lobbyRole", "host");
    } else {
      sessionStorage.removeItem("lobbyRole");
    }
    updateStartButton();
  });

  socket.on("join_denied", ({ message }) => {
    expelFromLobby(message);
  });

  socket.on("error_message", ({ message, code }) => {
    if (code === "QUIZ_OWNER_CANNOT_PLAY") {
      expelFromLobby(message);
      return;
    }
    statusEl.textContent = message;
  });

  socket.on("answer_scored", ({ points, totalScore }) => {
    if (points > 0) {
      timerEl.textContent = `+${points} pts — total : ${totalScore} pts`;
    } else {
      timerEl.textContent = "Mauvaise réponse — en attente des autres…";
    }
  });

  socket.on("session_update", ({ status, host, participants, hostCanPlay: canPlay }) => {
    if (status !== "waiting") return;
    hostCanPlay = Boolean(canPlay);
    setActiveLobby(code);
    statusEl.textContent = hostCanPlay
      ? "En attente — vous jouerez aussi à ce quiz public"
      : "En attente du démarrage";
    showWaiting();
    renderLobbyPlayers(participantsList, hostBannerEl, { host, participants });
  });

  socket.on("session_closed", ({ message }) => {
    expelFromLobby(
      message || "L'hôte a quitté la partie.",
      { title: "Partie interrompue", variant: "warning" },
    );
  });

  socket.on("game_started", ({ quizTitle, questionCount, hostCanPlay: canPlay }) => {
    hostCanPlay = Boolean(canPlay);
    statusEl.textContent = `${quizTitle} — ${questionCount} question(s)`;
    waitingBlock.hidden = true;
    updateStartButton();
  });

  socket.on("question_started", (data) => {
    showQuestion(data);
  });

  socket.on("question_result", ({ leaderboard }) => {
    clearTimer();
    showScores(leaderboard, "Révélation de la bonne réponse…");
  });

  socket.on("game_finished", ({ leaderboard }) => {
    clearTimer();
    renderGameResults(container, {
      leaderboard,
      username: currentUsername,
      isHost: isHost && !hostCanPlay,
      onLeave: () => {
        disconnectSocket();
        leaveLobby("/dashboard");
      },
    });
    socket.emit("leave_lobby");
    disconnectSocket();
    clearLobbySession();
  });

  async function joinLobby() {
    const { user } = await getMe();
    currentUsername = user.username;
    socket.emit("join_session", {
      code,
      role: isHostHint ? "host" : "player",
    });
    if (!isHostHint) {
      statusEl.textContent = `Connecté en tant que ${user.username}`;
    }
  }

  startBtn.addEventListener("click", () => {
    if (!isHost) return;
    socket.emit("host_start_game");
  });

  joinLobby().catch(() => {
    statusEl.textContent = "Impossible de rejoindre le lobby";
    navigateTo("/login", { replace: true });
  });
}
