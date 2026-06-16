-- À exécuter dans phpMyAdmin sur la base buzzr

ALTER TABLE users
  ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN verification_token VARCHAR(64) NULL,
  ADD COLUMN verification_token_expires DATETIME NULL,
  ADD COLUMN reset_token VARCHAR(64) NULL,
  ADD COLUMN reset_token_expires DATETIME NULL;

-- Comptes déjà existants : les considérer comme vérifiés
UPDATE users SET email_verified = 1;
