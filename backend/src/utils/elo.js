const DEFAULT_ELO = 1000;
const K_FACTOR = 24;
const MIN_ELO = 100;

function eloToRank(elo) {
  if (elo < 800) return "F";
  if (elo < 900) return "E";
  if (elo < 1000) return "D";
  if (elo < 1100) return "C";
  if (elo < 1200) return "B";
  if (elo < 1300) return "A";
  return "S";
}

function resolvePlayerRating(elo, gamesPlayed) {
  const played = Number(gamesPlayed) || 0;

  if (played <= 0) {
    return {
      elo_rating: null,
      rank: "F",
      is_unranked: true,
    };
  }

  const rating = Number(elo) || DEFAULT_ELO;

  return {
    elo_rating: rating,
    rank: eloToRank(rating),
    is_unranked: false,
  };
}

function computeEloUpdates(players) {
  const updates = new Map();
  const n = players.length;

  if (n === 0) return updates;

  if (n === 1) {
    updates.set(Number(players[0].userId), players[0].elo);
    return updates;
  }

  for (const player of players) {
    const actual = (n - player.rank) / (n - 1);
    const delta = Math.round(K_FACTOR * (actual - 0.5));
    updates.set(
      Number(player.userId),
      Math.max(MIN_ELO, player.elo + delta),
    );
  }

  return updates;
}

module.exports = {
  DEFAULT_ELO,
  eloToRank,
  resolvePlayerRating,
  computeEloUpdates,
};
