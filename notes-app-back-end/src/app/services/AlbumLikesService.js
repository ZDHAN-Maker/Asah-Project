const { nanoid } = require('nanoid');
const { createClient } = require('redis');
const NotFoundError = require('../utils/error/NotFoundError');

class AlbumLikesService {
  constructor(pool) {
    this._pool = pool;
    this._redis = createClient({ url: process.env.REDIS_SERVER });
    this._redis.connect();
  }

  async likeAlbum(albumId, userId) {
    // Cek apakah album ada
    const albumCheck = await this._pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
    if (!albumCheck.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    // Cek apakah user sudah like
    const checkQuery = {
      text: 'SELECT id FROM album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };
    const check = await this._pool.query(checkQuery);
    if (check.rowCount > 0) {
      throw new Error('User sudah menyukai album ini');
    }

    const id = `like-${nanoid(16)}`;
    await this._pool.query({
      text: 'INSERT INTO album_likes(id, album_id, user_id) VALUES($1, $2, $3)',
      values: [id, albumId, userId],
    });

    await this._redis.del(`album_likes:${albumId}`);
    return id;
  }

  async unlikeAlbum(albumId, userId) {
    const result = await this._pool.query({
      text: 'DELETE FROM album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    });

    if (!result.rowCount) {
      throw new NotFoundError('Like tidak ditemukan');
    }

    await this._redis.del(`album_likes:${albumId}`);
  }

  async getLikesCount(albumId) {
    // Cek album
    const albumCheck = await this._pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
    if (!albumCheck.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    // Cek cache
    const cached = await this._redis.get(`album_likes:${albumId}`);
    if (cached) {
      return { count: parseInt(cached, 10), fromCache: true };
    }

    // Query database
    const result = await this._pool.query({
      text: 'SELECT COUNT(*) FROM album_likes WHERE album_id = $1',
      values: [albumId],
    });
    const count = parseInt(result.rows[0].count, 10);

    await this._redis.setEx(`album_likes:${albumId}`, 1800, count.toString());
    return { count, fromCache: false };
  }
}

module.exports = AlbumLikesService;
