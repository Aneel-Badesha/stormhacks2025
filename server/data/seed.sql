-- seed.sql — one-shot data insert for users, companies, rewards
PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- Optional resets (comment out if you don't want to wipe)
DELETE FROM rewards;
DELETE FROM users;
DELETE FROM companies;

-- ----------------------------
-- Companies (5 demo logins)
-- ----------------------------
-- Using the same demo bcrypt hash for all: password = "password"
-- Generated: $2b$12$1KDSqkSLgz1pcDUjt30zKuVZT3vYGLG27H4mNP0MF/HLfp.RT5kD2
INSERT INTO companies (id, name, description, login_email, password_hash, is_active, created_at)
VALUES
  (1, 'Tim Hortons',  'Tim Hortons Tims Rewards loyalty program', 'p',  '$2b$12$1KDSqkSLgz1pcDUjt30zKuVZT3vYGLG27H4mNP0MF/HLfp.RT5kD2', 1, CURRENT_TIMESTAMP),
  (2, 'Pizza Palace', 'Pizza rewards program',              'pizza@login.local',   '$2b$12$1KDSqkSLgz1pcDUjt30zKuVZT3vYGLG27H4mNP0MF/HLfp.RT5kD2', 1, CURRENT_TIMESTAMP),
  (3, 'Book Haven',   'Book lover rewards',                 'books@login.local',   '$2b$12$1KDSqkSLgz1pcDUjt30zKuVZT3vYGLG27H4mNP0MF/HLfp.RT5kD2', 1, CURRENT_TIMESTAMP),
  (4, 'Gym Fitness',  'Gym membership points',              'gym@login.local',     '$2b$12$1KDSqkSLgz1pcDUjt30zKuVZT3vYGLG27H4mNP0MF/HLfp.RT5kD2', 1, CURRENT_TIMESTAMP),
  (5, 'Bakery Bliss', 'Bakery punch card',                  'bakery@login.local',  '$2b$12$1KDSqkSLgz1pcDUjt30zKuVZT3vYGLG27H4mNP0MF/HLfp.RT5kD2', 1, CURRENT_TIMESTAMP);

-- ----------------------------
-- Users (10 demo customers)
-- ----------------------------
INSERT INTO users (id, email, phone, full_name, created_at) VALUES
  (1,  'alice@example.com',    '+1111111111', 'Alice Anderson',   CURRENT_TIMESTAMP),
  (2,  'bob@example.com',      '+1222222222', 'Bob Baker',        CURRENT_TIMESTAMP),
  (3,  'charlie@example.com',  '+1333333333', 'Charlie Chen',     CURRENT_TIMESTAMP),
  (4,  'diana@example.com',    '+1444444444', 'Diana Davis',      CURRENT_TIMESTAMP),
  (5,  'evan@example.com',     '+1555555555', 'Evan Evans',       CURRENT_TIMESTAMP),
  (6,  'fiona@example.com',    '+1666666666', 'Fiona Foster',     CURRENT_TIMESTAMP),
  (7,  'george@example.com',   '+1777777777', 'George Garcia',    CURRENT_TIMESTAMP),
  (8,  'hannah@example.com',   '+1888888888', 'Hannah Harris',    CURRENT_TIMESTAMP),
  (9,  'ian@example.com',      '+1999999999', 'Ian Ingram',       CURRENT_TIMESTAMP),
  (10, 'julia@example.com',    '+1000000000', 'Julia Johnson',    CURRENT_TIMESTAMP);

-- ------------------------------------------------------
-- Rewards (systematic pattern for easy visualization)
-- Company 1 (Tim Hortons): Users 1–4 scores 2,4,6,8
-- Company 2 (Pizza Palace): Users 2–5 scores 3,5,7,9
-- Company 3 (Book Haven):   Users 3–6 scores 1,4,7,10
-- Company 4 (Gym Fitness):  Users 4–7 scores 2,5,8,10
-- Company 5 (Bakery Bliss): Users 5–8 scores 3,6,9,10
-- ------------------------------------------------------
INSERT INTO rewards (user_id, company_id, score, target_score, last_scan_at, created_at, updated_at) VALUES
  -- Tim Hortons (company_id=1)
  (1, 1, 2, 5, datetime('now', '-4 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 1, 4, 5, datetime('now', '-3 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 1, 6, 5, datetime('now', '-2 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 1, 8, 5, datetime('now', '-1 day'),   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Pizza Palace (company_id=2)
  (2, 2, 3, 10, datetime('now', '-5 hours'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 2, 5, 10, datetime('now', '-4 hours'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 2, 7, 10, datetime('now', '-3 hours'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (5, 2, 9, 10, datetime('now', '-2 hours'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Book Haven (company_id=3)
  (3, 3, 1, 10, datetime('now', '-6 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 3, 4, 10, datetime('now', '-5 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (5, 3, 7, 10, datetime('now', '-4 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (6, 3,10, 10, datetime('now', '-3 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Gym Fitness (company_id=4)
  (4, 4, 2, 10, datetime('now', '-8 hours'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (5, 4, 5, 10, datetime('now', '-6 hours'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (6, 4, 8, 10, datetime('now', '-4 hours'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (7, 4,10, 10, datetime('now', '-2 hours'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Bakery Bliss (company_id=5)
  (5, 5, 3, 10, datetime('now', '-10 days'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (6, 5, 6, 10, datetime('now', '-8 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (7, 5, 9, 10, datetime('now', '-6 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (8, 5,10, 10, datetime('now', '-4 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;
