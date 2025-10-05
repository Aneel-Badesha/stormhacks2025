-- SQLite Schema (company-login only; users are customers)
PRAGMA foreign_keys = ON;

-- Customers earning rewards (no login here)
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT UNIQUE NOT NULL,
  phone       TEXT,
  full_name   TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
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
  target_score   INTEGER DEFAULT 10,
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

-- ---------- Sample data with bcrypt password hashes ----------
-- Default password for all: "password"
-- Hash generated with: bcrypt.hashpw(b"password", bcrypt.gensalt())
INSERT INTO companies (id, name, description, login_email, password_hash) VALUES
  (1, 'Coffee Shop', 'Local coffee shop loyalty program', 'coffee@login.local',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qvXZm'),
  (2, 'Pizza Place', 'Pizza rewards program',              'pizza@login.local',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qvXZm'),
  (3, 'Bookstore',   'Book lover rewards',                 'books@login.local',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qvXZm');

INSERT INTO users (id, email, phone, full_name) VALUES
  (1, 'alice@example.com',  '+1234567890', 'Alice Smith'),
  (2, 'bob@example.com',    '+1234567891', 'Bob Johnson'),
  (3, 'charlie@example.com','+1234567892', 'Charlie Brown');

INSERT INTO rewards (user_id, company_id, score, target_score, last_scan_at) VALUES
  (1, 1, 5, 10, datetime('now', '-2 days')),
  (1, 2, 8, 10, datetime('now', '-1 day')),
  (2, 1, 3, 10, datetime('now', '-3 days')),
  (2, 3,10, 10, datetime('now', '-1 hour')),
  (3, 1, 7, 10, datetime('now', '-5 hours'));

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_rewards_user    ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_company ON rewards(company_id);
CREATE INDEX IF NOT EXISTS idx_rewards_score   ON rewards(score);
