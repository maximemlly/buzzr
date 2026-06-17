const userModel = require('../models/userModel');

async function isAdmin(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user || !user.is_active || user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    console.error('isAdmin:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = { isAdmin };
