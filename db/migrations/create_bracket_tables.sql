-- Migration: create participants and matches tables (SQLite/Postgres compatible)

CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  bracket_id INTEGER,
  slot1Id INTEGER REFERENCES participants(id),
  slot2Id INTEGER REFERENCES participants(id),
  slot1Score INTEGER,
  slot2Score INTEGER,
  startTime DATETIME,
  live BOOLEAN DEFAULT 0,
  status TEXT
);

-- Notes:
--  - match ids should be seeded to match the frontend flattened mapping (0..14 for 16 players)
--  - adjust serial/auto-increment semantics for Postgres if needed (use SERIAL or IDENTITY)
