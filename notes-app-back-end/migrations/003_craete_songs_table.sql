-- Tabel Songs
CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    performer VARCHAR(255) NOT NULL,
    genre VARCHAR(255),
    duration INTERVAL,
    album_id INT,
    CONSTRAINT fk_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
);