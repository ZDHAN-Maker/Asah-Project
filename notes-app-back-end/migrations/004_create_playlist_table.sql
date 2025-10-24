CREATE TABLE playlists (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner TEXT,
    FOREIGN KEY (owner) REFERENCES users(id) ON DELETE SET NULL
);