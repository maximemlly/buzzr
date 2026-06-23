const pool = require('../config/db');

const USER_FIELDS =
  'id, username, email, password_hash, role, is_active, email_verified, created_at';

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${USER_FIELDS}, verification_token, verification_token_expires, reset_token, reset_token_expires FROM users WHERE email = ?`,
    [email]
  );
  return rows[0] ?? null;
}

async function findByUsername(username) {
  const [rows] = await pool.execute(
    'SELECT id FROM users WHERE username = ?',
    [username]
  );
  return rows[0] ?? null;
}

async function findByUsernameExceptUserId(username, userId) {
  const [rows] = await pool.execute(
    'SELECT id FROM users WHERE username = ? AND id != ?',
    [username, userId]
  );
  return rows[0] ?? null;
}

async function findAuthById(id) {
  const [rows] = await pool.execute(
    `SELECT ${USER_FIELDS}, password_hash FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT ${USER_FIELDS} FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

async function findByVerificationToken(token) {
  const [rows] = await pool.execute(
    `SELECT ${USER_FIELDS}, verification_token_expires FROM users WHERE verification_token = ?`,
    [token]
  );
  return rows[0] ?? null;
}

async function findByResetToken(token) {
  const [rows] = await pool.execute(
    `SELECT ${USER_FIELDS}, reset_token_expires FROM users WHERE reset_token = ?`,
    [token]
  );
  return rows[0] ?? null;
}

async function createUser({ username, email, passwordHash, verificationToken, verificationTokenExpires }) {
  const [result] = await pool.execute(
    `INSERT INTO users (username, email, password_hash, role, is_active, email_verified, verification_token, verification_token_expires)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [username, email, passwordHash, 'user', 1, 0, verificationToken, verificationTokenExpires]
  );
  return findById(result.insertId);
}

async function setVerificationToken(userId, token, expires) {
  await pool.execute(
    'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
    [token, expires, userId]
  );
}

async function verifyEmail(userId) {
  await pool.execute(
    'UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
    [userId]
  );
}

async function setResetToken(userId, token, expires) {
  await pool.execute(
    'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
    [token, expires, userId]
  );
}

async function updatePassword(userId, passwordHash) {
  await pool.execute(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
    [passwordHash, userId]
  );
}

async function updateUsername(userId, username) {
  await pool.execute('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
}

module.exports = {
  findByEmail,
  findByUsername,
  findByUsernameExceptUserId,
  findAuthById,
  findById,
  findByVerificationToken,
  findByResetToken,
  createUser,
  setVerificationToken,
  verifyEmail,
  setResetToken,
  updatePassword,
  updateUsername,
};
