import { getMe } from "../services/api.js";
import { connectSocket, disconnectSocket } from "../services/socket.js";
import { navigateTo, setActiveLobby, leaveLobby, clearLobbySession } from "../utils/navigation.js";
import { renderGameResults } from "../components/gameResults.js";

function renderNamesList(listEl, participants) {
  listEl.replaceChildren();

  if (!participants.length) {
    const empty = document.createElement("p");
    empty.className = "quiz-empty";
    empty.textContent = "En attente de joueurs…";
    listEl.append(empty);
    return;
  }

  for (const player of participants) {
    const li = document.createElement("li");
    li.textContent = player.nickname;
    listEl.append(li);
  }
}

function renderLeaderboard(listEl, leaderboard) {
  listEl.replaceChildren();
  leaderboard.forEach((entry, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${entry.nickname} — ${entry.score} pts`;
    listEl.append(li);
  });
}

export function renderLobby(container, code) {
  container.replaceChildren();
  disconnectSocket();
  const socket = connectSocket();

  const isHost = sessionStorage.getItem("lobbyRole") === "host";

  const section = document.createElement("section");
  section.className = "dashboard";

  const title = document.createElement("h1");
  title.textContent = `Lobby — ${code}`;

  const statusEl = document.createElement("p");
  statusEl.className = "quiz-empty";
  statusEl.textContent = "Connexion…";

  const waitingBlock = document.createElement("div");
  waitingBlock.className = "waiting-block";

  const participantsTitle = document.createElement("h2");
  participantsTitle.textContent = "Joueurs connectés";

  const participantsList = document.createElement("ul");
  participantsList.className = "quiz-list";

  waitingBlock.append(participantsTitle, participantsList);

  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.textContent = "Démarrer la partie";
  startBtn.hidden = !isHost;

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

  const scoreList = document.createElement("ul");
  scoreList.className = "quiz-list";

  scoreBlock.append(scoreTitle, scoreList);

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.textContent = "Quitter";
  backBtn.addEventListener("click", leaveGame);

  gameArea.append(questionLabel, timerEl, answersEl, resultEl);
  section.append(
    title,
    statusEl,
    waitingBlock,
    startBtn,
    gameArea,
    scoreBlock,
    backBtn,
  );
  container.append(section);

  let timerInterval = null;
  let hasAnswered = false;
  let currentUsername = "";

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

  function showWaiting() {
    waitingBlock.hidden = false;
    startBtn.hidden = !isHost;
    gameArea.hidden = true;
    scoreBlock.hidden = true;
  }

  function showQuestion(data) {
    waitingBlock.hidden = true;
    startBtn.hidden = true;
    scoreBlock.hidden = true;
    gameArea.hidden = false;
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

    if (!isHost) {
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
      hostMsg.textContent = "Les joueurs répondent sur leur écran…";
      answersEl.append(hostMsg);
    }
  }

  function showScores(leaderboard, message) {
    waitingBlock.hidden = true;
    gameArea.hidden = false;
    answersEl.replaceChildren();
    resultEl.hidden = false;
    resultEl.textContent = message;
    scoreBlock.hidden = false;
    renderLeaderboard(scoreList, leaderboard);
  }

  socket.on("error_message", ({ message }) => {
    statusEl.textContent = message;
  });

  socket.on("session_update", ({ status, participants }) => {
    if (status !== "waiting") return;
    setActiveLobby(code);
    statusEl.textContent = "En attente du démarrage";
    showWaiting();
    renderNamesList(participantsList, participants);
  });

  socket.on("session_closed", ({ message }) => {
    disconnectSocket();
    leaveLobby("/dashboard");
    if (message) {
      sessionStorage.setItem("lobbyClosedMessage", message);
    }
  });

  socket.on("game_started", ({ quizTitle, questionCount }) => {
    statusEl.textContent = `${quizTitle} — ${questionCount} question(s)`;
    waitingBlock.hidden = true;
    startBtn.hidden = true;
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
    socket.emit("leave_lobby");
    disconnectSocket();
    clearLobbySession();
    renderGameResults(container, {
      leaderboard,
      username: currentUsername,
      isHost,
      onLeave: () => leaveLobby("/dashboard"),
    });
  });

  async function joinLobby() {
    const { user } = await getMe();
    currentUsername = user.username;
    socket.emit("join_session", {
      code,
      role: isHost ? "host" : "player",
    });
    if (!isHost) {
      statusEl.textContent = `Connecté en tant que ${user.username}`;
    }
  }

  startBtn.addEventListener("click", () => {
    socket.emit("host_start_game");
  });

  joinLobby().catch(() => {
    statusEl.textContent = "Impossible de rejoindre le lobby";
    navigateTo("/login", { replace: true });
  });
}
