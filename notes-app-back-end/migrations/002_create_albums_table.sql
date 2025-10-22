-- Tabel Albums
CREATE TABLE albums (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    cover VARCHAR(255)
);
