CREATE TABLE songs (
    id TEXT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year INT,
    performer VARCHAR(255),
    genre VARCHAR(255),
    duration INT,
    album_id TEXT,  -- Mengubah tipe data menjadi TEXT
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);
