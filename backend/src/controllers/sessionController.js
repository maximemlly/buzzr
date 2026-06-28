const sessionModel = require("../models/sessionModel");
const quizModel = require("../models/quizModel");
const userModel = require("../models/userModel");
const roomManager = require("../sockets/roomManager");
const jwt = require("jsonwebtoken");
const { resolvePlayerRating } = require("../utils/elo");

const QUIZ_OWNER_BLOCK_MESSAGE =
  "Vous êtes le créateur de ce quiz. Pour éviter toute triche, vous ne pouvez pas rejoindre une partie lancée par un autre joueur sur votre propre quiz. Lancez votre propre partie depuis le dashboard si vous souhaitez l'animer.";

function isQuizOwner(quiz, userId) {
  return Number(quiz.user_id) === Number(userId);
}

async function createSession(req, res) {
  try {
    const { quiz_id } = req.body;

    if (!quiz_id) {
      return res.status(400).json({ message: "quiz_id requis" });
    }

    const quiz = await quizModel.findById(quiz_id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz introuvable" });
    }

    if (!isQuizOwner(quiz, req.user.id)) {
      if (!quiz.is_published) {
        return res.status(403).json({ message: "Ce quiz n'est pas public" });
      }
    }

    const fullQuiz = await quizModel.findFullQuiz(quiz_id);
    if (!fullQuiz.questions.length) {
      return res.status(400).json({
        message: "Ajoutez au moins une question avant de lancer une partie",
      });
    }

    const session = await sessionModel.createSession({
      quizId: quiz_id,
      hostId: req.user.id,
    });

    roomManager.createRoom({
      code: session.code,
      sessionId: session.id,
      quizId: quiz.id,
      hostId: req.user.id,
      quizOwnerId: quiz.user_id,
      isPublished: Boolean(quiz.is_published),
    });

    res.status(201).json({ session });
  } catch (err) {
    console.error("createSession:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

async function getSessionByCode(req, res) {
  try {
    const session = await sessionModel.findByCode(req.params.code);
    if (!session) {
      return res.status(404).json({ message: "Partie introuvable" });
    }

    const quiz = await quizModel.findById(session.quiz_id);
    const participants = await sessionModel.getParticipants(session.id);

    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ") && quiz) {
      try {
        const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
        if (isQuizOwner(quiz, payload.id)) {
          return res.status(403).json({
            message: QUIZ_OWNER_BLOCK_MESSAGE,
            code: "QUIZ_OWNER_CANNOT_PLAY",
          });
        }
      } catch {
        // Token invalide : on renvoie quand même les infos publiques de la session.
      }
    }

    res.json({
      session: {
        code: session.code,
        status: session.status,
        quizTitle: quiz?.title ?? "Quiz",
        participantCount: participants.length,
      },
    });
  } catch (err) {
    console.error("getSessionByCode:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

async function getGameHistory(req, res) {
  try {
    const limit = Number(req.query.limit) || 5;
    const [history, stats, eloRating] = await Promise.all([
      sessionModel.getUserGameHistory(req.user.id, { limit }),
      sessionModel.getUserDashboardStats(req.user.id),
      userModel.getEloRating(req.user.id),
    ]);

    const gamesPlayed = Number(stats.games_played) || 0;
    const rating = resolvePlayerRating(eloRating, gamesPlayed);

    res.json({
      history: history.map((row) => ({
        quiz_id: row.quiz_id,
        quiz_title: row.quiz_title,
        score: row.score,
        played_at: row.joined_at,
        status: row.status,
        is_perfect: row.total_questions > 0 && row.correct_answers === row.total_questions,
      })),
      stats: {
        games_played: gamesPlayed,
        quizzes_mastered: Number(stats.quizzes_mastered) || 0,
        best_score: Number(stats.best_score) || 0,
        victories: Number(stats.victories) || 0,
        success_rate: stats.success_rate,
        win_streak: Number(stats.win_streak) || 0,
        elo_rating: rating.elo_rating,
        rank: rating.rank,
        is_unranked: rating.is_unranked,
      },
    });
  } catch (err) {
    console.error("getGameHistory:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

module.exports = { createSession, getSessionByCode, getGameHistory };
