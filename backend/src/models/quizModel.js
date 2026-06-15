const pool = require("../config/db");

// Fonctions pour les quizzes

async function findAllByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, title, description, is_published, created_at
     FROM quizzes
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}

async function findById(quizId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, title, description, is_published, created_at
        FROM quizzes
        WHERE id = ?`,
    [quizId],
  );
  return rows[0] ?? null;
}

async function create({ userId, title, description }) {
  const [result] = await pool.execute(
    `INSERT INTO quizzes (user_id, title, description, is_published)
        VALUES (?, ?, ?, 0)`,
    [userId, title, description ?? null],
  );
  return findById(result.insertId);
}

async function update(quizId, { title, description, isPublished }) {
  await pool.execute(
    `UPDATE quizzes SET title = ?, description = ?, is_published = ?
        WHERE id = ?`,
    [title, description ?? null, isPublished ? 1 : 0, quizId],
  );
  return findById(quizId);
}

async function remove(quizId) {
  const [result] = await pool.execute(`DELETE FROM quizzes WHERE id = ?`, [
    quizId,
  ]);
  return result.affectedRows > 0;
}

// Fonctions pour les questions

async function findQuestionsByQuizId(quizId) {
  const [rows] = await pool.execute(
    `SELECT id, quiz_id, label, timer_seconds, order_index
    FROM questions
    WHERE quiz_id = ?
    ORDER BY order_index ASC`,
    [quizId],
  );
  return rows;
}

async function findQuestionById(questionId) {
  const [rows] = await pool.execute(
    `SELECT id, quiz_id, label, timer_seconds, order_index
    FROM questions
    WHERE id = ?`,
    [questionId],
  );
  return rows[0] ?? null;
}

async function createQuestion({ quizId, label, timerSeconds, orderIndex }) {
  const [result] = await pool.execute(
    `INSERT INTO questions (quiz_id, label, timer_seconds, order_index)
    VALUES (?, ?, ?, ?)`,
    [quizId, label, timerSeconds ?? 20, orderIndex ?? 0],
  );
  return findQuestionById(result.insertId);
}

async function removeQuestion(questionId) {
  const [result] = await pool.execute(`DELETE FROM questions WHERE id = ?`, [
    questionId,
  ]);
  return result.affectedRows > 0;
}

// Fonctions pour les réponses

async function findAnswersByQuestionId(questionId) {
  const [rows] = await pool.execute(
    `SELECT id, question_id, label, is_correct
    FROM answers
    WHERE question_id = ?`,
    [questionId],
  );
  return rows;
}

async function createAnswer({ questionId, label, isCorrect }) {
  const [result] = await pool.execute(
    `INSERT INTO answers (question_id, label, is_correct)
    VALUES (?, ?, ?)`,
    [questionId, label, isCorrect ? 1 : 0],
  );
  const [rows] = await pool.execute(
    `SELECT id, question_id, label, is_correct FROM answers WHERE id = ?`,
    [result.insertId],
  );
  return rows[0];
}

// Fonctions pour les quiz

async function findFullQuiz(quizId) {
  const quiz = await findById(quizId);
  if (!quiz) return null;

  const questions = await findQuestionsByQuizId(quizId);

  for (const question of questions) {
    question.answers = await findAnswersByQuestionId(question.id);
  }

  quiz.questions = questions;
  return quiz;
}

module.exports = {
  findAllByUserId,
  findById,
  create,
  update,
  remove,
  findQuestionsByQuizId,
  findQuestionById,
  createQuestion,
  removeQuestion,
  findAnswersByQuestionId,
  createAnswer,
  findFullQuiz,
};
