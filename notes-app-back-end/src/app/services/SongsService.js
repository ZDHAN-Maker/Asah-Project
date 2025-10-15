const { nanoid } = require('nanoid');
const pool = require('../db');
const NotFoundError = require('../utils/error/NotFoundError');
const InvariantError = require('../utils/error/InvariantError');
const ClientError = require('../utils/error/ClientError');
class SongsService {
  async addSong({ title, year, performer, genre, duration, albumId, playlistId, userId }) {
    if (albumId) {
      const checkAlbum = await pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
      if (!checkAlbum.rowCount) {
        throw new InvariantError('Album tidak ditemukan');
      }
    }

    const id = `song-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: `
      INSERT INTO songs(id, title, year, performer, genre, duration, album_id, created_at, updated_at)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
      values: [id, title, year, performer, genre, duration, albumId || null, createdAt, updatedAt],
    };

    const result = await pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    const songId = result.rows[0].id;

    // Check if the user is authorized to add the song to the playlist
    const checkPlaylistOwner = await pool.query('SELECT owner FROM playlists WHERE id = $1', [
      playlistId,
    ]);

    if (!checkPlaylistOwner.rowCount || checkPlaylistOwner.rows[0].owner !== userId) {
      throw new ClientError(
        'Anda tidak memiliki akses untuk menambahkan lagu ke playlist ini',
        403
      );
    }

    // Add the song to the playlist
    await pool.query('INSERT INTO playlist_songs(playlist_id, song_id) VALUES($1, $2)', [
      playlistId,
      songId,
    ]);

    return songId;
  }

  async getSongs({ title, performer }) {
    let base = 'SELECT id, title, performer FROM songs';
    const conditions = [];
    const values = [];
    if (title) {
      values.push(`%${title}%`);
      conditions.push(`LOWER(title) LIKE LOWER($${values.length})`);
    }
    if (performer) {
      values.push(`%${performer}%`);
      conditions.push(`LOWER(performer) LIKE LOWER($${values.length})`);
    }
    if (conditions.length) base += ' WHERE ' + conditions.join(' AND ');
    const res = await pool.query({ text: base, values });
    return res.rows;
  }

  async getSongById(id) {
    const query = {
      text: `
      SELECT 
        id, 
        title, 
        year, 
        performer, 
        genre, 
        duration, 
        album_id AS "albumId"
      FROM songs
      WHERE id = $1
    `,
      values: [id],
    };

    const res = await pool.query(query);

    if (!res.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return res.rows[0];
  }

  async updateSongById(id, { title, year, performer, genre, duration, albumId }) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: `UPDATE songs
             SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, album_id = $6, updated_at = $7
             WHERE id = $8
             RETURNING id`,
      values: [title, year, performer, genre, duration, albumId || null, updatedAt, id],
    };

    const res = await pool.query(query);

    if (!res.rowCount) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }

    return res.rows[0].id;
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id=$1 RETURNING id',
      values: [id],
    };
    const res = await pool.query(query);
    if (!res.rowCount) throw new NotFoundError('Gagal menghapus lagu. Id tidak ditemukan');
  }

  async getSongsByAlbumId(albumId) {
    const query = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [albumId],
    };
    const res = await pool.query(query);
    return res.rows;
  }
}

module.exports = SongsService;
