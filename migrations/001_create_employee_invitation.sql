-- ====================================================================
-- CARICLOUD POS DATABASE MIGRATION
-- Migration: 001_create_employee_invitation.sql
-- Description: Creates EMPLOYEE_INVITATION table for secure employee invitation & verification workflow.
-- ====================================================================

CREATE TABLE IF NOT EXISTS EMPLOYEE_INVITATION (
  invitation_id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  CONSTRAINT fk_invitation_tenant FOREIGN KEY (tenant_id) REFERENCES user(user_id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_tenant_id (tenant_id)
);
