
-- Tabel Collaborations (Kolaborasi antara Playlist dan Users)
CREATE TABLE collaborations (
    id SERIAL PRIMARY KEY,
    playlist_id INT,
    user_id INT,
    CONSTRAINT fk_collaboration_playlist FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    CONSTRAINT fk_collaboration_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);