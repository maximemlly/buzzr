const userModel = require("../models/userModel");
const sessionModel = require("../models/sessionModel");
const { computeEloUpdates } = require("../utils/elo");

async function finalizeGameStats(room) {
  const totalQuestions = room.quiz?.questions?.length ?? 0;
  if (totalQuestions === 0) return;

  const rankedPlayers = [...room.players.values()]
    .filter((player) => player.userId)
    .sort(
      (a, b) =>
        b.score - a.score || (b.tieBreaker ?? 0) - (a.tieBreaker ?? 0),
    );

  for (const player of rankedPlayers) {
    await sessionModel.updateParticipantStats(player.participantId, {
      correctAnswers: player.correctAnswers ?? 0,
      totalQuestions,
    });
  }

  if (rankedPlayers.length === 0) return;

  const userIds = rankedPlayers.map((player) => player.userId);
  const eloByUser = await userModel.getEloRatings(userIds);
  const placements = rankedPlayers.map((player, index) => ({
    userId: Number(player.userId),
    elo: eloByUser.get(Number(player.userId)) ?? 1000,
    rank: index + 1,
  }));

  const eloUpdates = computeEloUpdates(placements);
  for (const [userId, elo] of eloUpdates) {
    await userModel.updateElo(userId, elo);
  }
}

module.exports = { finalizeGameStats };
