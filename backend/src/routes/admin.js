const express = require('express');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id/status', adminController.setUserStatus);
router.delete('/users/:id', adminController.eraseUser);

router.get('/quizzes', adminController.listQuizzes);
router.patch('/quizzes/:id/unpublish', adminController.unpublishQuiz);
router.delete('/quizzes/:id', adminController.deleteQuiz);

module.exports = router;
