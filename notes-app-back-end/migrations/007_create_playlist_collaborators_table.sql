CREATE TABLE collaborations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT,
    user_id INT,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);