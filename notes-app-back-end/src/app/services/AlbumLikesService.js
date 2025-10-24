const { nanoid } = require('nanoid');
const { createClient } = require('redis');

class AlbumLikesService {
  constructor(pool) {
    this._pool = pool;
    this._redis = createClient({ url: process.env.REDIS_SERVER });
    this._redis.connect();
  }

  async likeAlbum(albumId, userId) {
    // Pastikan belum pernah like
    const checkQuery = {
      text: 'SELECT * FROM album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };
    const check = await this._pool.query(checkQuery);
    if (check.rowCount) throw new Error('User sudah menyukai album ini');

    const id = `like-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, albumId, userId],
    };
    await this._pool.query(query);

    // Hapus cache
    await this._redis.del(`album_likes:${albumId}`);
    return id;
  }

  async unlikeAlbum(albumId, userId) {
    const query = {
      text: 'DELETE FROM album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };
    await this._pool.query(query);
    await this._redis.del(`album_likes:${albumId}`);
  }

  async getLikesCount(albumId) {
    // Cek cache
    const cache = await this._redis.get(`album_likes:${albumId}`);
    if (cache) return { count: parseInt(cache, 10), fromCache: true };

    const query = {
      text: 'SELECT COUNT(*) FROM album_likes WHERE album_id = $1',
      values: [albumId],
    };
    const result = await this._pool.query(query);
    const count = parseInt(result.rows[0].count, 10);

    // Simpan ke cache 30 menit
    await this._redis.setEx(`album_likes:${albumId}`, 1800, count.toString());

    return { count, fromCache: false };
  }
}

module.exports = AlbumLikesService;
