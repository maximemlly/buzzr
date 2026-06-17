const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/db');
const userModel = require('../models/userModel');
const adminModel = require('../models/adminModel');
const { maskEmail } = require('../utils/privacy');

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: maskEmail(user.email),
    role: user.role,
    is_active: Boolean(user.is_active),
    email_verified: Boolean(user.email_verified),
    quiz_count: Number(user.quiz_count) || 0,
    created_at: user.created_at,
  };
}

async function listUsers(req, res) {
  try {
    const limit = req.query.limit;
    const offset = req.query.offset;
    const { users, total } = await adminModel.listUsers({ limit, offset });

    res.json({
      users: users.map(toPublicUser),
      total,
      privacy_notice:
        'Les adresses e-mail sont masquées par défaut (minimisation des données, art. 5 RGPD).',
    });
  } catch (err) {
    console.error('admin listUsers:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function getUser(req, res) {
  try {
    const user = await userModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const [[{ quiz_count }]] = await pool.execute(
      'SELECT COUNT(*) AS quiz_count FROM quizzes WHERE user_id = ?',
      [user.id]
    );

    await adminModel.logAdminAction({
      adminId: req.adminUser.id,
      action: 'view_user_email',
      targetType: 'user',
      targetId: user.id,
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: Boolean(user.is_active),
        email_verified: Boolean(user.email_verified),
        quiz_count: Number(quiz_count) || 0,
        created_at: user.created_at,
      },
      privacy_notice: 'Consultation enregistrée à des fins de traçabilité (art. 30 RGPD).',
    });
  } catch (err) {
    console.error('admin getUser:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function listQuizzes(req, res) {
  try {
    const { quizzes, total } = await adminModel.listQuizzes({
      limit: req.query.limit,
      offset: req.query.offset,
    });

    res.json({
      quizzes: quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        is_published: Boolean(q.is_published),
        owner_id: q.owner_id,
        owner_username: q.owner_username,
        created_at: q.created_at,
      })),
      total,
    });
  } catch (err) {
    console.error('admin listQuizzes:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function setUserStatus(req, res) {
  try {
    const userId = Number(req.params.id);
    const { is_active: isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'is_active (booléen) requis' });
    }

    if (userId === req.adminUser.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre compte' });
    }

    const target = await userModel.findById(userId);

    if (!target) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (target.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de modérer un autre administrateur' });
    }

    await adminModel.setUserActive(userId, isActive);
    await adminModel.logAdminAction({
      adminId: req.adminUser.id,
      action: isActive ? 'activate_user' : 'deactivate_user',
      targetType: 'user',
      targetId: userId,
    });

    res.json({
      message: isActive ? 'Compte réactivé' : 'Compte désactivé',
    });
  } catch (err) {
    console.error('admin setUserStatus:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function eraseUser(req, res) {
  try {
    const userId = Number(req.params.id);

    if (userId === req.adminUser.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const target = await userModel.findById(userId);

    if (!target) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (target.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de supprimer un administrateur' });
    }

    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    await adminModel.anonymizeUser(userId, passwordHash);
    await adminModel.logAdminAction({
      adminId: req.adminUser.id,
      action: 'anonymize_user',
      targetType: 'user',
      targetId: userId,
    });

    res.json({
      message:
        'Données personnelles anonymisées (droit à l\'effacement, art. 17 RGPD). Les quiz associés sont conservés sans lien identifiable.',
    });
  } catch (err) {
    console.error('admin eraseUser:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function unpublishQuiz(req, res) {
  try {
    const quizId = Number(req.params.id);
    const ok = await adminModel.unpublishQuiz(quizId);

    if (!ok) {
      return res.status(404).json({ message: 'Quiz introuvable' });
    }

    await adminModel.logAdminAction({
      adminId: req.adminUser.id,
      action: 'unpublish_quiz',
      targetType: 'quiz',
      targetId: quizId,
    });

    res.json({ message: 'Quiz dépublié' });
  } catch (err) {
    console.error('admin unpublishQuiz:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function deleteQuiz(req, res) {
  try {
    const quizId = Number(req.params.id);
    const ok = await adminModel.deleteQuiz(quizId);

    if (!ok) {
      return res.status(404).json({ message: 'Quiz introuvable' });
    }

    await adminModel.logAdminAction({
      adminId: req.adminUser.id,
      action: 'delete_quiz',
      targetType: 'quiz',
      targetId: quizId,
    });

    res.json({ message: 'Quiz supprimé' });
  } catch (err) {
    console.error('admin deleteQuiz:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = {
  listUsers,
  getUser,
  listQuizzes,
  setUserStatus,
  eraseUser,
  unpublishQuiz,
  deleteQuiz,
};
