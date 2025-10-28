CREATE TABLE playlist_song_activities (
    id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL,
  song_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action VARCHAR(50) NOT NULL,
  time TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);