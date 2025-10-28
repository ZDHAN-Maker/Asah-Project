
CREATE TABLE user_album_likes (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    album_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

