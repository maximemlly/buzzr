const crypto = require("crypto");

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function expiresInHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

module.exports = { generateToken, expiresInHours };
