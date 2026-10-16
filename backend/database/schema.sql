-- Expense Tracker schema (MySQL 8.0+)
-- Safe to run more than once: it only creates what doesn't exist yet and
-- never drops tables or deletes data.
--
-- `npm run db:init` runs this file against the database named in DB_NAME.

-- -------------------------------------------------------------------------
-- users: one row per account
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(254)  NOT NULL,
  -- bcrypt hash (60 chars). The plain-text password is never stored.
  password_hash VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Guarantees no two accounts share an email, even under concurrent sign-ups.
  -- The column collation is case-insensitive, so A@x.com and a@x.com collide.
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------------------
-- transactions: every income or expense entry, owned by exactly one user
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id               INT UNSIGNED             NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED             NOT NULL,
  type             ENUM('income','expense') NOT NULL,
  -- DECIMAL stores exact values (FLOAT/DOUBLE would turn 0.10 into 0.1000000015).
  -- (12,2) = up to 9,999,999,999.99
  amount           DECIMAL(12,2)            NOT NULL,
  category         VARCHAR(50)              NOT NULL,
  description      VARCHAR(255)                 NULL,
  transaction_date DATE                     NOT NULL,
  created_at       TIMESTAMP                NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP                NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Deleting a user also deletes their transactions.
  CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  -- Last line of defence if application validation is ever bypassed.
  CONSTRAINT chk_transactions_amount_positive CHECK (amount > 0),
  -- Almost every query filters by user and date range (lists, dashboard,
  -- reports), so these composite indexes keep them fast as data grows.
  KEY idx_transactions_user_date (user_id, transaction_date),
  KEY idx_transactions_user_type_date (user_id, type, transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
