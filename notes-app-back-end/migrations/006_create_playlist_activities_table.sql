
-- Tabel Playlist Song Activities (History aktivitas dalam playlist)
CREATE TABLE playlist_song_activities (
    id SERIAL PRIMARY KEY,
    playlist_id INT,
    song_id INT,
    user_id INT,
    action VARCHAR(255),
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_playlist_activity FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    CONSTRAINT fk_song_activity FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_activity FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);