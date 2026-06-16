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

module.exports = {
  findById,
  findByCode,
  createSession,
  updateStatus,
  addParticipant,
  getParticipants,
  updateParticipantScore,
  findParticipantBySessionAndUser,
};
