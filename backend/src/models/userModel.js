const pool = require('../config/db');

async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, username, email, password_hash, role, is_active FROM users WHERE email = ?',
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

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, username, email, role, is_active, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] ?? null;
}

async function createUser({ username, email, passwordHash }) {
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, email, passwordHash, 'user']
  );
  return findById(result.insertId);
}

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  createUser,
};
