const { nanoid } = require('nanoid');
const pool = require('../db');
const NotFoundError = require('../utils/error/NotFoundError');

class AlbumsService {
  constructor() {
    this.pool = pool; // Ensure that all methods use the same pool
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`; // Generate a unique ID for the album
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums(id, name, year, created_at, updated_at) VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    try {
      const res = await pool.query(query);
      if (!res.rows[0].id) {
        throw new Error('Failed to add album');
      }
      return res.rows[0].id; // Return the album ID as a string
    } catch (error) {
      console.error(error);
      throw new Error('An error occurred while adding the album');
    }
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT id, name, year, cover_url FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album not found'); // Ensure proper NotFoundError handling
    }

    const album = result.rows[0];
    const songsQuery = {
      text: 'SELECT id, title FROM songs WHERE album_id = $1',
      values: [id],
    };

    const songsResult = await this.pool.query(songsQuery);

    return {
      id: album.id,
      name: album.name,
      year: album.year,
      coverUrl: album.cover_url || null,
      songs: songsResult.rows || [], // Ensure an empty array if no songs are found
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
      throw new NotFoundError('Album not found for update');
    }

    return res.rows[0].id; // Return the album ID as a string
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id=$1 RETURNING id',
      values: [id],
    };
    const res = await this.pool.query(query);

    if (!res.rowCount) {
      throw new NotFoundError('Album not found for deletion');
    }

    return res.rows[0].id; // Return the album ID as a string
  }

  async updateCoverUrl(albumId, coverUrl) {
    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, albumId],
    };
    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album not found');
    }

    return result.rows[0].id; // Return the album ID as a string
  }
}

module.exports = AlbumsService;
