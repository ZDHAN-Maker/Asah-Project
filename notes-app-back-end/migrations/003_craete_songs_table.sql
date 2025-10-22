CREATE TABLE songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    performer VARCHAR(255) NOT NULL,
    genre VARCHAR(255),
    duration TIME,
    album_id INT,
    FOREIGN KEY (album_id) REFERENCES albums(id)
);