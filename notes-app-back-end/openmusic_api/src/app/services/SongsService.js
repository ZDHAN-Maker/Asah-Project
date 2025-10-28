const { nanoid } = require('nanoid');
const { Pool } = require('pg');

const NotFoundError = require('../utils/error/NotFoundError');
const InvariantError = require('../utils/error/InvariantError');

class SongsService {
  constructor(pool) {
    // Gunakan satu sumber pool dari parameter constructor
    this._pool = pool || new Pool();
  }

  async addSong({ title, year, performer, genre, duration, albumId }) {
    if (albumId) {
      // Pastikan album ada sebelum insert
      const checkAlbum = await this._pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
      if (!checkAlbum.rowCount) {
        throw new InvariantError('Album tidak ditemukan');
      }
    }

    const songId = `song-${nanoid(16)}`;
    const query = {
      text: `
        INSERT INTO songs (id, title, year, performer, genre, duration, album_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      values: [songId, title, year, performer, genre, duration, albumId || null],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongs({ title, performer }) {
    let baseQuery = 'SELECT id, title, performer FROM songs';
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

    if (conditions.length) baseQuery += ` WHERE ${conditions.join(' AND ')}`;

    const result = await this._pool.query({ text: baseQuery, values });
    return result.rows;
  }

  async getSongById(id) {
    const query = {
      text: `
        SELECT 
          id, title, year, performer, genre, duration, 
          album_id AS "albumId"
        FROM songs
        WHERE id = $1
      `,
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return result.rows[0];
  }

  async updateSongById(id, { title, year, performer, genre, duration, albumId }) {
    // Cek lagu
    const checkSong = await this._pool.query('SELECT id FROM songs WHERE id = $1', [id]);
    if (!checkSong.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    // Cek album
    if (albumId) {
      const checkAlbum = await this._pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
      if (!checkAlbum.rowCount) {
        throw new InvariantError('Album tidak ditemukan');
      }
    }

    const query = {
      text: `
        UPDATE songs
        SET title=$1, year=$2, performer=$3, genre=$4, duration=$5, album_id=$6
        WHERE id=$7
        RETURNING id
      `,
      values: [title, year, performer, genre, duration, albumId || null, id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }

    return result.rows[0].id;
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Gagal menghapus lagu. Id tidak ditemukan');
    }
  }

  async getSongsByAlbumId(albumId) {
    const query = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [albumId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = SongsService;
