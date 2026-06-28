const pool = require("../config/db");

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function findById(sessionId) {
  const [rows] = await pool.execute(
    `SELECT id, quiz_id, host_id, code, status, created_at
     FROM game_sessions WHERE id = ?`,
    [sessionId],
  );
  return rows[0] ?? null;
}

async function findByCode(code) {
  const [rows] = await pool.execute(
    `SELECT id, quiz_id, host_id, code, status, created_at
     FROM game_sessions WHERE code = ?`,
    [code.toUpperCase()],
  );
  return rows[0] ?? null;
}

async function createSession({ quizId, hostId }) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    try {
      const [result] = await pool.execute(
        `INSERT INTO game_sessions (quiz_id, host_id, code, status)
         VALUES (?, ?, ?, 'waiting')`,
        [quizId, hostId, code],
      );
      return findById(result.insertId);
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") continue;
      throw err;
    }
  }
  throw new Error("Impossible de générer un code unique");
}

async function updateStatus(sessionId, status) {
  await pool.execute(`UPDATE game_sessions SET status = ? WHERE id = ?`, [
    status,
    sessionId,
  ]);
}

async function addParticipant({ sessionId, userId, nickname }) {
  const [result] = await pool.execute(
    `INSERT INTO participants (session_id, user_id, nickname, score)
     VALUES (?, ?, ?, 0)`,
    [sessionId, userId ?? null, nickname],
  );
  const [rows] = await pool.execute(
    `SELECT id, session_id, user_id, nickname, score, joined_at
     FROM participants WHERE id = ?`,
    [result.insertId],
  );
  return rows[0];
}

async function findParticipantBySessionAndUser(sessionId, userId) {
  const [rows] = await pool.execute(
    `SELECT id, session_id, user_id, nickname, score, joined_at
     FROM participants WHERE session_id = ? AND user_id = ?`,
    [sessionId, userId],
  );
  return rows[0] ?? null;
}

async function getParticipants(sessionId) {
  const [rows] = await pool.execute(
    `SELECT id, session_id, user_id, nickname, score, joined_at
     FROM participants WHERE session_id = ?
     ORDER BY joined_at ASC`,
    [sessionId],
  );
  return rows;
}

async function updateParticipantScore(participantId, score) {
  await pool.execute(`UPDATE participants SET score = ? WHERE id = ?`, [
    score,
    participantId,
  ]);
}

async function updateParticipantStats(participantId, { correctAnswers, totalQuestions }) {
  await pool.execute(
    `UPDATE participants SET correct_answers = ?, total_questions = ? WHERE id = ?`,
    [correctAnswers, totalQuestions, participantId],
  );
}

async function getUserGameHistory(userId, { limit = 5 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 50);
  const [rows] = await pool.execute(
    `SELECT p.score, p.joined_at, p.correct_answers, p.total_questions,
            q.title AS quiz_title, q.id AS quiz_id, gs.status
     FROM participants p
     INNER JOIN game_sessions gs ON gs.id = p.session_id
     INNER JOIN quizzes q ON q.id = gs.quiz_id
     WHERE p.user_id = ? AND gs.status = 'finished'
     ORDER BY p.joined_at DESC
     LIMIT ${safeLimit}`,
    [userId],
  );
  return rows;
}

async function getUserFinishedGameOutcomes(userId) {
  const [rows] = await pool.execute(
    `SELECT
       p.score,
       p.joined_at,
       (SELECT MAX(p2.score) FROM participants p2 WHERE p2.session_id = p.session_id) AS session_max_score
     FROM participants p
     INNER JOIN game_sessions gs ON gs.id = p.session_id
     WHERE p.user_id = ? AND gs.status = 'finished'
     ORDER BY p.joined_at DESC`,
    [userId],
  );

  return rows.map((row) => ({
    isWin: Number(row.score) === Number(row.session_max_score),
  }));
}

function computeWinStreak(outcomes) {
  let streak = 0;
  for (const outcome of outcomes) {
    if (!outcome.isWin) break;
    streak += 1;
  }
  return streak;
}

async function getUserDashboardStats(userId) {
  const [rows] = await pool.execute(
    `SELECT
       COUNT(*) AS games_played,
       COALESCE(SUM(p.score), 0) AS total_score,
       COALESCE(MAX(p.score), 0) AS best_score,
       COALESCE(SUM(p.correct_answers), 0) AS correct_sum,
       COALESCE(SUM(p.total_questions), 0) AS question_sum,
       COUNT(DISTINCT CASE
         WHEN p.total_questions > 0 AND p.correct_answers = p.total_questions
         THEN gs.quiz_id
       END) AS quizzes_mastered,
       SUM(CASE
         WHEN p.score >= (
           SELECT MAX(p2.score) FROM participants p2 WHERE p2.session_id = p.session_id
         ) THEN 1 ELSE 0
       END) AS victories
     FROM participants p
     INNER JOIN game_sessions gs ON gs.id = p.session_id
     WHERE p.user_id = ? AND gs.status = 'finished'`,
    [userId],
  );

  const aggregate = rows[0] ?? {};
  const questionSum = Number(aggregate.question_sum) || 0;
  const correctSum = Number(aggregate.correct_sum) || 0;
  const outcomes = await getUserFinishedGameOutcomes(userId);

  return {
    games_played: Number(aggregate.games_played) || 0,
    total_score: Number(aggregate.total_score) || 0,
    best_score: Number(aggregate.best_score) || 0,
    quizzes_mastered: Number(aggregate.quizzes_mastered) || 0,
    victories: Number(aggregate.victories) || 0,
    success_rate: questionSum > 0 ? Math.round((correctSum / questionSum) * 100) : null,
    win_streak: computeWinStreak(outcomes),
  };
}

module.exports = {
  findById,
  findByCode,
  createSession,
  updateStatus,
  addParticipant,
  getParticipants,
  updateParticipantScore,
  updateParticipantStats,
  findParticipantBySessionAndUser,
  getUserGameHistory,
  getUserDashboardStats,
};
