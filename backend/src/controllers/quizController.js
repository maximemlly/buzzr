const quizModel = require("../models/quizModel");

function isOwner(quiz, userId) {
  return Number(quiz.user_id) === Number(userId);
}

async function listQuizzes(req, res) {
  try {
    const quizzes = await quizModel.findAllByUserId(req.user.id);
    res.json({ quizzes });
  } catch (err) {
    console.error("listQuizzes:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

async function createQuiz(req, res) {
  try {
    const { title, description } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Titre manquant" });
    }

    const quiz = await quizModel.create({
      userId: req.user.id,
      title: title.trim(),
      description: description?.trim() || null,
    });

    res.status(201).json({ quiz });
  } catch (err) {
    console.error("createQuiz:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

async function getQuiz(req, res) {
  try {
    const quiz = await quizModel.findFullQuiz(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz introuvable" });
    }

    if (!isOwner(quiz, req.user.id)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    res.json({ quiz });
  } catch (err) {
    console.error("getQuiz:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

async function updateQuiz(req, res) {
  try {
    const quiz = await quizModel.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz introuvable" });
    }

    if (!isOwner(quiz, req.user.id)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const { title, description, is_published } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Titre manquant" });
    }

    const updatedQuiz = await quizModel.update(req.params.id, {
      title: title.trim(),
      description: description?.trim() || null,
      isPublished: Boolean(is_published),
    });

    res.json({ quiz: updatedQuiz });
  } catch (err) {
    console.error("updateQuiz:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

async function deleteQuiz(req, res) {
  try {
    const quiz = await quizModel.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz introuvable" });
    }

    if (!isOwner(quiz, req.user.id)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await quizModel.remove(req.params.id);
    res.json({ message: "Quiz supprimé avec succès" });
  } catch (err) {
    console.error("deleteQuiz:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

async function addQuestion(req, res) {
  try {
    const quiz = await quizModel.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz introuvable" });
    }

    if (!isOwner(quiz, req.user.id)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const { label, timer_seconds, order_index, answers } = req.body;

    if (!label?.trim()) {
      return res.status(400).json({ message: "Label manquant" });
    }

    if (!Array.isArray(answers) || answers.length < 2) {
      return res
        .status(400)
        .json({ message: "Une question doit avoir au moins 2 réponses" });
    }

    const correctCount = answers.filter((answer) => answer.is_correct).length;
    if (correctCount !== 1) {
      return res.status(400).json({
        message: "Une question ne peut avoir qu'une seule bonne réponse",
      });
    }

    for (const answer of answers) {
      if (!answer.label?.trim()) {
        return res.status(400).json({ message: "Chaque réponse doit avoir un libellé" });
      }
    }

    const question = await quizModel.createQuestion({
      quizId: req.params.id,
      label: label.trim(),
      timerSeconds: timer_seconds ?? 20,
      orderIndex: order_index ?? 0,
    });

    const createdAnswers = [];
    for (const answer of answers) {
      const created = await quizModel.createAnswer({
        questionId: question.id,
        label: answer.label.trim(),
        isCorrect: answer.is_correct,
      });
      createdAnswers.push(created);
    }

    question.answers = createdAnswers;
    res.status(201).json({ question });
  } catch (err) {
    console.error("addQuestion:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

async function deleteQuestion(req, res) {
  try {
    const quiz = await quizModel.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz introuvable" });
    }
    if (!isOwner(quiz, req.user.id)) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    const question = await quizModel.findQuestionById(req.params.questionId);
    if (!question || Number(question.quiz_id) !== Number(req.params.id)) {
      return res.status(404).json({ message: "Question introuvable" });
    }
    await quizModel.removeQuestion(req.params.questionId);
    res.json({ message: "Question supprimée" });
  } catch (err) {
    console.error("deleteQuestion:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}
module.exports = {
  listQuizzes,
  createQuiz,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  deleteQuestion,
};
