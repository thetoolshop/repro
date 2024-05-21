--
-- Up
--

CREATE TABLE recordings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  mode INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  browserName TEXT,
  browserVersion TEXT,
  operatingSystem TEXT,
  codecVersion TEXT NOT NULL
);

--
-- Down
--

DROP TABLE IF EXISTS recordings;
