const pool = require('../config/db');

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

function clampPagination(limit, offset) {
  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  return { limit: safeLimit, offset: safeOffset };
}

async function listUsers({ limit, offset }) {
  const { limit: safeLimit, offset: safeOffset } = clampPagination(limit, offset);

  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.email, u.role, u.is_active, u.email_verified, u.created_at,
            (SELECT COUNT(*) FROM quizzes q WHERE q.user_id = u.id) AS quiz_count
     FROM users u
     ORDER BY u.created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`
  );

  const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM users');

  return { users: rows, total, limit: safeLimit, offset: safeOffset };
}

async function listQuizzes({ limit, offset }) {
  const { limit: safeLimit, offset: safeOffset } = clampPagination(limit, offset);

  const [rows] = await pool.execute(
    `SELECT q.id, q.title, q.description, q.is_published, q.created_at,
            u.id AS owner_id, u.username AS owner_username
     FROM quizzes q
     JOIN users u ON u.id = q.user_id
     ORDER BY q.created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`
  );

  const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM quizzes');

  return { quizzes: rows, total, limit: safeLimit, offset: safeOffset };
}

async function setUserActive(userId, isActive) {
  const [result] = await pool.execute(
    'UPDATE users SET is_active = ? WHERE id = ?',
    [isActive ? 1 : 0, userId]
  );
  return result.affectedRows > 0;
}

async function anonymizeUser(userId, passwordHash) {
  const [result] = await pool.execute(
    `UPDATE users SET
       username = CONCAT('deleted_', ?),
       email = CONCAT('deleted_', ?, '@anonymized.local'),
       password_hash = ?,
       is_active = 0,
       email_verified = 0,
       verification_token = NULL,
       verification_token_expires = NULL,
       reset_token = NULL,
       reset_token_expires = NULL
     WHERE id = ?`,
    [userId, userId, passwordHash, userId]
  );
  return result.affectedRows > 0;
}

async function unpublishQuiz(quizId) {
  const [result] = await pool.execute(
    'UPDATE quizzes SET is_published = 0 WHERE id = ?',
    [quizId]
  );
  return result.affectedRows > 0;
}

async function deleteQuiz(quizId) {
  const [result] = await pool.execute('DELETE FROM quizzes WHERE id = ?', [quizId]);
  return result.affectedRows > 0;
}

async function logAdminAction({ adminId, action, targetType, targetId }) {
  await pool.execute(
    'INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?)',
    [adminId, action, targetType, targetId]
  );
}

module.exports = {
  listUsers,
  listQuizzes,
  setUserActive,
  anonymizeUser,
  unpublishQuiz,
  deleteQuiz,
  logAdminAction,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
};
