const { nanoid } = require('nanoid');
const pool = require('../db');
const NotFoundError = require('../utils/error/NotFoundError');

class AlbumsService {
  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const query = {
      text: 'INSERT INTO albums(id, name, year, created_at, updated_at) VALUES($1,$2,$3,$4,$5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };
    const res = await pool.query(query);
    return res.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT id, name, year FROM albums WHERE id = $1',
      values: [id],
    };
    const res = await pool.query(query);
    if (!res.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    return res.rows[0];
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name=$1, year=$2, updated_at=$3 WHERE id=$4 RETURNING id',
      values: [name, year, updatedAt, id],
    };
    const res = await pool.query(query);
    if (!res.rowCount) throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id=$1 RETURNING id',
      values: [id],
    };
    const res = await pool.query(query);
    if (!res.rowCount) throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
  }

  async updateCoverUrl(albumId, coverUrl) {
    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, albumId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    return result.rows[0];
  }
}

module.exports = AlbumsService;
