const { nanoid } = require('nanoid');
const NotFoundError = require('../utils/error/NotFoundError');
const CacheService = require('./CacheService');

class AlbumLikesService {
  constructor(pool) {
    this._pool = pool;
    this._cache = new CacheService(); // ⬅️ inisialisasi cache
  }

  async checkUserLike(albumId, userId) {
    const result = await this._pool.query({
      text: 'SELECT 1 FROM user_album_likes WHERE album_id = $1 AND user_id = $2 LIMIT 1',
      values: [albumId, userId],
    });
    return result.rowCount > 0;
  }

  async likeAlbum(albumId, userId) {
    const album = await this._pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
    if (!album.rowCount) throw new NotFoundError('Album tidak ditemukan');

    const alreadyLiked = await this.checkUserLike(albumId, userId);
    if (alreadyLiked) {
      const error = new Error('User sudah menyukai album ini');
      error.code = 'DUPLICATE_LIKE';
      throw error;
    }

    const id = `like-${nanoid(16)}`;
    await this._pool.query({
      text: 'INSERT INTO user_album_likes(id, album_id, user_id) VALUES($1, $2, $3)',
      values: [id, albumId, userId],
    });

    // 🧹 hapus cache setiap kali ada perubahan like
    await this._cache.delete(`album_likes:${albumId}`);
    return id;
  }

  async unlikeAlbum(albumId, userId) {
    const result = await this._pool.query({
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    });
    if (!result.rowCount) throw new NotFoundError('Like tidak ditemukan');

    // 🧹 hapus cache setiap kali unlike
    await this._cache.delete(`album_likes:${albumId}`);
  }

  async getLikesCount(albumId) {
    const album = await this._pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
    if (!album.rowCount) throw new NotFoundError('Album tidak ditemukan');

    const cacheKey = `album_likes:${albumId}`;
    try {
      // 🎯 coba ambil dari cache
      const cached = await this._cache.get(cacheKey);
      return { count: parseInt(cached, 10), fromCache: true };
    } catch {
      // 🚫 cache miss → ambil dari DB
      const result = await this._pool.query({
        text: 'SELECT COUNT(*)::int AS total FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      });
      const count = result.rows[0].total;

      // 💾 simpan ke cache 30 menit (1800 detik)
      await this._cache.set(cacheKey, count.toString(), 1800);
      return { count, fromCache: false };
    }
  }
}

module.exports = AlbumLikesService;
