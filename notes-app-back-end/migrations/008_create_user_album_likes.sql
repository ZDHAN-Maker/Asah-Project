CREATE TABLE user_album_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    album_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (album_id) REFERENCES albums(id)
);