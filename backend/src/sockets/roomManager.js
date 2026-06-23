const rooms = new Map();

function getRoom(code) {
  return rooms.get(code.toUpperCase()) ?? null;
}

function createRoom({ code, sessionId, quizId, hostId, quizOwnerId, isPublished = false }) {
  const room = {
    code: code.toUpperCase(),
    sessionId,
    quizId,
    hostId: Number(hostId),
    quizOwnerId: Number(quizOwnerId),
    isPublished: Boolean(isPublished),
    hostCanPlay: false,
    hostSocketId: null,
    hostNickname: null,
    status: "waiting",
    quiz: null,
    currentQuestionIndex: 0,
    players: new Map(),
    answersReceived: new Set(),
    questionTimer: null,
    questionClosedForIndex: -1,
  };
  rooms.set(room.code, room);
  return room;
}

function addPlayer(room, socketId, player) {
  room.players.set(socketId, player);
}

function removePlayer(room, socketId) {
  room.players.delete(socketId);
}

function getWaitingPlayerList(room) {
  return [...room.players.values()].map((p) => ({
    nickname: p.nickname,
    isPlayingHost: room.hostCanPlay && Number(p.userId) === room.hostId,
  }));
}

function findPlayerSocketByUserId(room, userId) {
  for (const [socketId, player] of room.players.entries()) {
    if (Number(player.userId) === Number(userId)) {
      return socketId;
    }
  }
  return null;
}

function clearQuestionTimer(room) {
  if (room.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }
}

function getPlayerList(room) {
  return [...room.players.values()].map((p) => ({
    nickname: p.nickname,
    score: p.score,
  }));
}

function getLeaderboard(room) {
  return [...room.players.values()]
    .map((p) => ({
      nickname: p.nickname,
      score: p.score,
      tieBreaker: p.tieBreaker ?? 0,
    }))
    .sort((a, b) => b.score - a.score || b.tieBreaker - a.tieBreaker);
}

function stripCorrectAnswers(question) {
  return {
    id: question.id,
    label: question.label,
    timer_seconds: question.timer_seconds,
    order_index: question.order_index,
    answers: question.answers.map((a) => ({ id: a.id, label: a.label })),
  };
}

function deleteRoom(code) {
  rooms.delete(code.toUpperCase());
}

module.exports = {
  getRoom,
  createRoom,
  addPlayer,
  removePlayer,
  getWaitingPlayerList,
  findPlayerSocketByUserId,
  clearQuestionTimer,
  getPlayerList,
  getLeaderboard,
  stripCorrectAnswers,
  deleteRoom,
};
