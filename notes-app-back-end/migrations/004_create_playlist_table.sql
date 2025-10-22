-- Tabel Playlists
CREATE TABLE playlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner INT,
    FOREIGN KEY (owner) REFERENCES users(id)
);