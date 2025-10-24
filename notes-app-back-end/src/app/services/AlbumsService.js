const { nanoid } = require('nanoid');
const pool = require('../db');
const NotFoundError = require('../utils/error/NotFoundError');

class AlbumsService {
  constructor() {
    this.pool = pool; // memastikan semua method menggunakan pool yang sama
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`; // Membuat ID unik untuk album
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums(id, name, year, created_at, updated_at) VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    try {
      const res = await pool.query(query);
      if (!res.rows[0].id) {
        throw new Error('Gagal menambahkan album');
      }

      // Mengembalikan albumId dalam respons
      return { albumId: res.rows[0].id }; // Mengembalikan objek dengan albumId
    } catch (error) {
      console.error(error);
      throw new Error('Terjadi kesalahan saat menambahkan album');
    }
  }

  async getAlbumById(id) {
    // Log the album id to debug
    console.log(`Getting album with id: ${id}`);

    const query = {
      text: 'SELECT id, name, year, cover_url FROM albums WHERE id = $1',
      values: [id],
    };

    // Execute the query
    const result = await this.pool.query(query);

    // Check if the album exists
    if (!result.rowCount) {
      // Throw error if album not found
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = result.rows[0];

    // Return the album details
    return {
      id: album.id,
      name: album.name,
      year: album.year,
      coverUrl: album.cover_url || null,
    };
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name=$1, year=$2, updated_at=$3 WHERE id=$4 RETURNING id',
      values: [name, year, updatedAt, id],
    };
    const res = await this.pool.query(query);

    if (!res.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }

    return res.rows[0].id;
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id=$1 RETURNING id',
      values: [id],
    };
    const res = await this.pool.query(query);

    if (!res.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }

    return res.rows[0].id;
  }

  async updateCoverUrl(albumId, coverUrl) {
    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, albumId],
    };
    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return result.rows[0].id;
  }
}

module.exports = AlbumsService;
