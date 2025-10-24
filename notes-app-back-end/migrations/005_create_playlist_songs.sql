CREATE TABLE playlist_songs (
    id TEXT PRIMARY KEY,
    playlist_id TEXT,
    song_id TEXT,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);