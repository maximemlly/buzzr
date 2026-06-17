-- Journal des actions admin (art. 30 RGPD — registre des traitements / traçabilité)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Promouvoir un compte en administrateur (remplace 1 par ton user id)
-- UPDATE users SET role = 'admin' WHERE id = 1;
