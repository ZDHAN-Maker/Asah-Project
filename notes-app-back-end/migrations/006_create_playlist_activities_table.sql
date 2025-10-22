CREATE TABLE IF NOT EXISTS playlist_activities (
  id TEXT PRIMARY KEY,
  playlist_id TEXT,
  song_id TEXT,
  user_id TEXT,
  action TEXT,                       
  time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_playlist FOREIGN KEY(playlist_id)
    REFERENCES playlists(id),
  CONSTRAINT fk_song FOREIGN KEY(song_id)
    REFERENCES songs(id),
  CONSTRAINT fk_user FOREIGN KEY(user_id)
    REFERENCES users(id)
);
