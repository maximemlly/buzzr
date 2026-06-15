const express = require("express");
const quizController = require("../controllers/quizController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", quizController.listQuizzes);
router.post("/", quizController.createQuiz);
router.get("/:id", quizController.getQuiz);
router.put("/:id", quizController.updateQuiz);
router.delete("/:id", quizController.deleteQuiz);
router.post("/:id/questions", quizController.addQuestion);
router.delete("/:id/questions/:questionId", quizController.deleteQuestion);

module.exports = router;
