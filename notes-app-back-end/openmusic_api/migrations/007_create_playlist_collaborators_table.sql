CREATE TABLE collaborations (
    id TEXT PRIMARY KEY,
    playlist_id TEXT,
    user_id TEXT,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
