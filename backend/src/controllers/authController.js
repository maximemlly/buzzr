const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '7d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères' });
    }

    if (await userModel.findByEmail(email.trim().toLowerCase())) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    if (await userModel.findByUsername(username.trim())) {
      return res.status(409).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userModel.createUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    console.error('register:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await userModel.findByEmail(email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = signToken(user);
    const { password_hash: _, ...safeUser } = user;

    res.json({ token, user: toPublicUser(safeUser) });
  } catch (err) {
    console.error('login:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function me(req, res) {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    console.error('me:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = { register, login, me };
