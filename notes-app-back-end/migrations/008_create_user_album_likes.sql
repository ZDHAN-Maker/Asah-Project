
-- Tabel User Album Likes (Junction Table antara Users dan Albums untuk likes)
CREATE TABLE user_album_likes (
    id SERIAL PRIMARY KEY,
    user_id INT,
    album_id INT,
    CONSTRAINT fk_user_album FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_album_like FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);