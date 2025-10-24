CREATE TABLE playlist_song_activities (
    id TEXT PRIMARY KEY,
    playlist_id TEXT,
    song_id TEXT,
    user_id TEXT,
    action VARCHAR(50),
    time TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
