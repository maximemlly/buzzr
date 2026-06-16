const jwt = require("jsonwebtoken");
const sessionModel = require("../models/sessionModel");
const quizModel = require("../models/quizModel");
const userModel = require("../models/userModel");
const roomManager = require("./roomManager");

const QUESTION_BASE_POINTS = 1000;

function getTokenUser(socket) {
  const token = socket.handshake.auth?.token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function emitSessionUpdate(io, room) {
  io.to(room.code).emit("session_update", {
    code: room.code,
    status: room.status,
    participants: roomManager.getWaitingPlayerList(room),
  });
}

function endQuestion(io, room) {
  if (room.questionClosedForIndex === room.currentQuestionIndex) {
    return;
  }
  room.questionClosedForIndex = room.currentQuestionIndex;
  roomManager.clearQuestionTimer(room);

  const question = room.quiz.questions[room.currentQuestionIndex];
  const correctAnswer = question.answers.find(
    (a) => Number(a.is_correct) === 1,
  );

  io.to(room.code).emit("question_result", {
    questionId: question.id,
    correctAnswerId: correctAnswer?.id ?? null,
    leaderboard: roomManager.getLeaderboard(room),
  });

  room.answersReceived.clear();
  room.currentQuestionIndex += 1;

  if (room.currentQuestionIndex >= room.quiz.questions.length) {
    room.status = "finished";
    sessionModel.updateStatus(room.sessionId, "finished");
    io.to(room.code).emit("game_finished", {
      leaderboard: roomManager.getLeaderboard(room),
    });
    return;
  }

  room.questionTimer = setTimeout(() => startQuestion(io, room), 3000);
}

function startQuestion(io, room) {
  roomManager.clearQuestionTimer(room);
  room.questionClosedForIndex = -1;

  const question = room.quiz.questions[room.currentQuestionIndex];
  room.answersReceived.clear();

  io.to(room.code).emit("question_started", {
    index: room.currentQuestionIndex,
    total: room.quiz.questions.length,
    question: roomManager.stripCorrectAnswers(question),
  });

  const durationMs = (question.timer_seconds ?? 20) * 1000;
  room.questionTimer = setTimeout(() => {
    if (room.status === "playing") {
      endQuestion(io, room);
    }
  }, durationMs);
}

async function registerPlayer(io, socket, room, tokenUser) {
  if (Number(tokenUser.id) === room.hostId) {
    socket.emit("error_message", {
      message: "L'hôte ne peut pas rejoindre en tant que joueur",
    });
    return;
  }

  const user = await userModel.findById(tokenUser.id);
  if (!user) {
    socket.emit("error_message", { message: "Utilisateur introuvable" });
    return;
  }

  const oldSocketId = roomManager.findPlayerSocketByUserId(room, user.id);
  if (oldSocketId) {
    roomManager.removePlayer(room, oldSocketId);
  }

  let participant = await sessionModel.findParticipantBySessionAndUser(
    room.sessionId,
    user.id,
  );

  if (!participant) {
    participant = await sessionModel.addParticipant({
      sessionId: room.sessionId,
      userId: user.id,
      nickname: user.username,
    });
  }

  roomManager.addPlayer(room, socket.id, {
    nickname: user.username,
    userId: user.id,
    score: participant.score,
    participantId: participant.id,
  });

  socket.join(room.code);
  socket.data.roomCode = room.code;
  socket.data.role = "player";

  emitSessionUpdate(io, room);
}

function getConnectedCount(io, roomCode) {
  return io.sockets.adapter.rooms.get(roomCode)?.size ?? 0;
}

async function destroyRoom(room) {
  if (!room) return;
  roomManager.clearQuestionTimer(room);
  roomManager.deleteRoom(room.code);
  try {
    await sessionModel.updateStatus(room.sessionId, "finished");
  } catch (err) {
    console.error("destroyRoom:", err);
  }
}

async function handleLeave(io, socket) {
  const code = socket.data.roomCode;
  if (!code) return;

  const room = roomManager.getRoom(code);
  if (!room) {
    socket.data.roomCode = null;
    return;
  }

  const role = socket.data.role;
  socket.leave(room.code);
  socket.data.roomCode = null;

  if (role === "host") {
    room.hostSocketId = null;
    if (room.status === "waiting") {
      io.to(room.code).emit("session_closed", {
        message: "L'hôte a quitté le lobby",
      });
      await destroyRoom(room);
      return;
    }
  } else {
    roomManager.removePlayer(room, socket.id);
    if (room.status === "waiting") {
      emitSessionUpdate(io, room);
    }
  }

  if (getConnectedCount(io, room.code) === 0) {
    await destroyRoom(room);
  }
}

function registerGameHandler(io) {
  io.on("connection", (socket) => {
    socket.on("join_session", async ({ code, role }) => {
      try {
        const tokenUser = getTokenUser(socket);
        if (!tokenUser) {
          socket.emit("error_message", { message: "Connexion requise" });
          return;
        }

        const session = await sessionModel.findByCode(code);
        if (!session || session.status === "finished") {
          socket.emit("error_message", { message: "Partie indisponible" });
          return;
        }

        let room = roomManager.getRoom(code);
        if (!room) {
          room = roomManager.createRoom({
            code: session.code,
            sessionId: session.id,
            quizId: session.quiz_id,
            hostId: session.host_id,
          });
        }

        if (role === "host") {
          if (Number(tokenUser.id) !== room.hostId) {
            socket.emit("error_message", { message: "Accès hôte refusé" });
            return;
          }
          room.hostSocketId = socket.id;
          socket.join(room.code);
          socket.data.roomCode = room.code;
          socket.data.role = "host";
          emitSessionUpdate(io, room);
          return;
        }

        await registerPlayer(io, socket, room, tokenUser);
      } catch (err) {
        console.error("join_session:", err);
        socket.emit("error_message", { message: "Erreur lors de la connexion" });
      }
    });

    socket.on("host_start_game", async () => {
      try {
        const room = roomManager.getRoom(socket.data.roomCode);
        if (!room || socket.id !== room.hostSocketId) {
          socket.emit("error_message", { message: "Action réservée à l'hôte" });
          return;
        }

        if (room.players.size < 1) {
          socket.emit("error_message", { message: "Aucun joueur connecté" });
          return;
        }

        const quiz = await quizModel.findFullQuiz(room.quizId);
        if (!quiz?.questions?.length) {
          socket.emit("error_message", {
            message: "Le quiz doit contenir au moins une question",
          });
          return;
        }

        room.quiz = quiz;
        room.status = "playing";
        room.currentQuestionIndex = 0;
        room.questionClosedForIndex = -1;
        await sessionModel.updateStatus(room.sessionId, "playing");

        io.to(room.code).emit("game_started", {
          quizTitle: quiz.title,
          questionCount: quiz.questions.length,
        });

        startQuestion(io, room);
      } catch (err) {
        console.error("host_start_game:", err);
        socket.emit("error_message", { message: "Impossible de démarrer la partie" });
      }
    });

    socket.on("submit_answer", async ({ answerId }) => {
      try {
        const room = roomManager.getRoom(socket.data.roomCode);
        if (!room || room.status !== "playing") return;
        if (room.questionClosedForIndex === room.currentQuestionIndex) return;
        if (room.answersReceived.has(socket.id)) return;

        const player = room.players.get(socket.id);
        if (!player) return;

        const question = room.quiz.questions[room.currentQuestionIndex];
        const answer = question.answers.find(
          (a) => Number(a.id) === Number(answerId),
        );
        if (!answer) return;

        room.answersReceived.add(socket.id);

        if (Number(answer.is_correct) === 1) {
          player.score += QUESTION_BASE_POINTS;
          await sessionModel.updateParticipantScore(
            player.participantId,
            player.score,
          );
        }

        if (room.answersReceived.size >= room.players.size) {
          endQuestion(io, room);
        }
      } catch (err) {
        console.error("submit_answer:", err);
      }
    });

    socket.on("leave_lobby", async () => {
      await handleLeave(io, socket);
    });

    socket.on("disconnect", async () => {
      await handleLeave(io, socket);
    });
  });
}

module.exports = registerGameHandler;
