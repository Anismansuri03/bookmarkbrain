CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT,
  category TEXT,
  folders TEXT,
  embedding TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
