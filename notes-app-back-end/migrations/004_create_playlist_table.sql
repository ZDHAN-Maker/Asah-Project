-- Tabel Playlists
CREATE TABLE playlists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner INT,
    CONSTRAINT fk_owner FOREIGN KEY (owner) REFERENCES users(id) ON DELETE CASCADE
);