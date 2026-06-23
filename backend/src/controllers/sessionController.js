const sessionModel = require("../models/sessionModel");
const quizModel = require("../models/quizModel");
const roomManager = require("../sockets/roomManager");
const jwt = require("jsonwebtoken");

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

module.exports = { createSession, getSessionByCode };
