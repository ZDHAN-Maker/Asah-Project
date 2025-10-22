CREATE TABLE playlist_song_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT,
    song_id INT,
    user_id INT,
    action VARCHAR(255),
    time TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id),
    FOREIGN KEY (song_id) REFERENCES songs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);