-- SQLite Schema (company-login only; users are customers)
PRAGMA foreign_keys = ON;

-- Customers earning rewards 
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  full_name     TEXT,
  password_hash TEXT,                        -- bcrypt hash for mobile app login
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Companies (each company has exactly one login)
CREATE TABLE IF NOT EXISTS companies (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  description    TEXT,
  login_email    TEXT UNIQUE NOT NULL,       -- company login
  password_hash  TEXT NOT NULL,              -- bcrypt/argon2 hash of the company password
  is_active      INTEGER NOT NULL DEFAULT 1, -- 1 = active
  last_login_at  DATETIME,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_login_email
  ON companies(login_email);

-- Rewards link users <-> companies
CREATE TABLE IF NOT EXISTS rewards (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL,
  company_id     INTEGER NOT NULL,
  score          INTEGER DEFAULT 0,
  target_score   INTEGER DEFAULT 5,
  last_scan_at   DATETIME,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE(user_id, company_id)
);

CREATE TRIGGER IF NOT EXISTS rewards_updated_at
AFTER UPDATE ON rewards
BEGIN
  UPDATE rewards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewards_user    ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_company ON rewards(company_id);
CREATE INDEX IF NOT EXISTS idx_rewards_score   ON rewards(score);
