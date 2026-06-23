const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { sendMail } = require('../config/mailer');
const { generateToken, expiresInHours } = require('../utils/tokens');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '7d';
const VERIFICATION_EXPIRES_HOURS = 24;
const RESET_EXPIRES_HOURS = 1;

function frontendUrl(path) {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}${path}`;
}

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
    email_verified: Boolean(user.email_verified),
    created_at: user.created_at,
  };
}

function validatePassword(password, passwordConfirm) {
  if (!password) {
    return 'Le mot de passe est requis';
  }
  if (password.length < 8) {
    return 'Le mot de passe doit faire au moins 8 caractères';
  }
  if (passwordConfirm !== undefined && password !== passwordConfirm) {
    return 'Les mots de passe ne correspondent pas';
  }
  return null;
}

async function sendVerificationEmail(user, token) {
  const link = frontendUrl(`/verify-email?token=${token}`);
  await sendMail({
    to: user.email,
    subject: 'Confirmez votre adresse e-mail — Buzzr',
    text: `Bonjour ${user.username},\n\nCliquez sur ce lien pour confirmer votre compte :\n${link}\n\nCe lien expire dans ${VERIFICATION_EXPIRES_HOURS} heures.`,
    html: `<p>Bonjour <strong>${user.username}</strong>,</p><p><a href="${link}">Confirmer mon compte</a></p><p>Ce lien expire dans ${VERIFICATION_EXPIRES_HOURS} heures.</p>`,
  });
}

async function sendResetEmail(user, token) {
  const link = frontendUrl(`/reset-password?token=${token}`);
  await sendMail({
    to: user.email,
    subject: 'Réinitialisation de mot de passe — Buzzr',
    text: `Bonjour ${user.username},\n\nCliquez sur ce lien pour choisir un nouveau mot de passe :\n${link}\n\nCe lien expire dans ${RESET_EXPIRES_HOURS} heure.`,
    html: `<p>Bonjour <strong>${user.username}</strong>,</p><p><a href="${link}">Réinitialiser mon mot de passe</a></p><p>Ce lien expire dans ${RESET_EXPIRES_HOURS} heure.</p>`,
  });
}

async function register(req, res) {
  try {
    const { username, email, password, passwordConfirm } = req.body;

    if (!username?.trim() || !email?.trim()) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const passwordError = validatePassword(password, passwordConfirm);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    if (await userModel.findByEmail(email.trim().toLowerCase())) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    if (await userModel.findByUsername(username.trim())) {
      return res.status(409).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
    }

    const verificationToken = generateToken();
    const verificationTokenExpires = expiresInHours(VERIFICATION_EXPIRES_HOURS);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await userModel.createUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      verificationToken,
      verificationTokenExpires,
    });

    await sendVerificationEmail(user, verificationToken);

    res.status(201).json({
      message: 'Compte créé. Vérifiez votre boîte mail pour activer votre compte.',
      user: toPublicUser(user),
    });
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

    if (!user.email_verified) {
      return res.status(403).json({
        message: 'Veuillez confirmer votre adresse e-mail avant de vous connecter.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    const token = signToken(user);
    const { password_hash: _, ...safeUser } = user;

    res.json({ token, user: toPublicUser(safeUser) });
  } catch (err) {
    console.error('login:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Token manquant' });
    }

    const user = await userModel.findByVerificationToken(token);

    if (!user) {
      return res.status(400).json({ message: 'Lien de vérification invalide' });
    }

    if (user.email_verified) {
      return res.json({ message: 'Votre compte est déjà vérifié.' });
    }

    if (new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Ce lien a expiré. Demandez un nouvel e-mail de vérification.' });
    }

    await userModel.verifyEmail(user.id);
    res.json({ message: 'Adresse e-mail confirmée. Vous pouvez vous connecter.' });
  } catch (err) {
    console.error('verifyEmail:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function resendVerification(req, res) {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: 'Adresse e-mail requise' });
    }

    const user = await userModel.findByEmail(email.trim().toLowerCase());

    // Réponse générique pour ne pas révéler si l'email existe
    const genericMessage = 'Si un compte existe avec cet e-mail, un nouveau lien a été envoyé.';

    if (!user || user.email_verified) {
      return res.json({ message: genericMessage });
    }

    const verificationToken = generateToken();
    const verificationTokenExpires = expiresInHours(VERIFICATION_EXPIRES_HOURS);
    await userModel.setVerificationToken(user.id, verificationToken, verificationTokenExpires);
    await sendVerificationEmail(user, verificationToken);

    res.json({ message: genericMessage });
  } catch (err) {
    console.error('resendVerification:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: 'Adresse e-mail requise' });
    }

    const user = await userModel.findByEmail(email.trim().toLowerCase());
    const genericMessage = 'Si un compte existe avec cet e-mail, un lien de réinitialisation a été envoyé.';

    if (!user || !user.is_active) {
      return res.json({ message: genericMessage });
    }

    const resetToken = generateToken();
    const resetTokenExpires = expiresInHours(RESET_EXPIRES_HOURS);
    await userModel.setResetToken(user.id, resetToken, resetTokenExpires);
    await sendResetEmail(user, resetToken);

    res.json({ message: genericMessage });
  } catch (err) {
    console.error('forgotPassword:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password, passwordConfirm } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token manquant' });
    }

    const passwordError = validatePassword(password, passwordConfirm);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await userModel.findByResetToken(token);

    if (!user) {
      return res.status(400).json({ message: 'Lien de réinitialisation invalide' });
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Ce lien a expiré. Demandez une nouvelle réinitialisation.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await userModel.updatePassword(user.id, passwordHash);

    res.json({ message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' });
  } catch (err) {
    console.error('resetPassword:', err);
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

async function updateProfile(req, res) {
  try {
    const { username } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({ message: 'Le nom d\'utilisateur est requis' });
    }

    const trimmed = username.trim();

    if (trimmed.length < 3) {
      return res.status(400).json({ message: 'Le pseudo doit faire au moins 3 caractères' });
    }

    const user = await userModel.findById(req.user.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    if (trimmed === user.username) {
      return res.json({ message: 'Aucune modification', user: toPublicUser(user) });
    }

    if (await userModel.findByUsernameExceptUserId(trimmed, user.id)) {
      return res.status(409).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
    }

    await userModel.updateUsername(user.id, trimmed);
    const updated = await userModel.findById(user.id);

    res.json({
      message: 'Pseudo mis à jour',
      user: toPublicUser(updated),
      token: signToken(updated),
    });
  } catch (err) {
    console.error('updateProfile:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel requis' });
    }

    const passwordError = validatePassword(newPassword, newPasswordConfirm);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await userModel.findAuthById(req.user.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    const sameAsOld = await bcrypt.compare(newPassword, user.password_hash);
    if (sameAsOld) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit être différent' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userModel.updatePassword(user.id, passwordHash);

    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    console.error('changePassword:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  me,
  updateProfile,
  changePassword,
};
