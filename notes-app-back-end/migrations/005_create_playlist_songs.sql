-- Tabel Playlist Songs (Junction Table antara Playlist dan Songs)
CREATE TABLE playlist_songs (
    id SERIAL PRIMARY KEY,
    playlist_id INT,
    song_id INT,
    CONSTRAINT fk_playlist FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    CONSTRAINT fk_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);