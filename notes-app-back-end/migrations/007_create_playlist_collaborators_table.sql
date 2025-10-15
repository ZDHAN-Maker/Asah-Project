CREATE TABLE IF NOT EXISTS collaborations (
  id TEXT PRIMARY KEY,
  playlist_id TEXT,
  user_id TEXT,
  CONSTRAINT fk_playlist FOREIGN KEY(playlist_id)
    REFERENCES playlists(id),
  CONSTRAINT fk_user FOREIGN KEY(user_id)
    REFERENCES users(id)
);
