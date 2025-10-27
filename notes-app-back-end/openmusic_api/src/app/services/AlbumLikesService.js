const { nanoid } = require('nanoid');

class AlbumLikesService {
  constructor(pool, cacheService) {
    this._pool = pool;
    this._cache = cacheService;
  }

  _cacheKey(albumId) {
    return `album:likes:${albumId}`;
  }

  async checkUserLike(albumId, userId) {
    const { rows } = await this._pool.query(
      'SELECT 1 FROM user_album_likes WHERE album_id = $1 AND user_id = $2 LIMIT 1',
      [albumId, userId]
    );
    return rows.length > 0;
  }

  async likeAlbum(albumId, userId) {
    // Cek apakah user sudah menyukai album
    const already = await this.checkUserLike(albumId, userId);
    if (already) {
      // Lempar error dengan code 'DUPLICATE_LIKE' untuk penanganan di handler
      const err = new Error('User already liked this album');
      err.code = 'DUPLICATE_LIKE';
      throw err;
    }

    // Membuat ID unik untuk like
    const id = nanoid();

    // Masukkan data ke tabel user_album_likes
    await this._pool.query(
      'INSERT INTO user_album_likes (id, album_id, user_id) VALUES ($1, $2, $3)',
      [id, albumId, userId]
    );

    // Hapus cache album yang baru saja disukai
    await this._cache.delete(this._cacheKey(albumId));
  }

  async unlikeAlbum(albumId, userId) {
    await this._pool.query('DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2', [
      albumId,
      userId,
    ]);
    await this._cache.delete(this._cacheKey(albumId));
  }

  async getLikesCount(albumId) {
    const key = this._cacheKey(albumId);

    try {
      const cached = await this._cache.get(key);
      if (cached !== null) {
        return { count: Number(cached), fromCache: true };
      }
    } catch (err) {
      console.error('[Redis Error] Gagal membaca cache:', err.message);
    }

    const { rows } = await this._pool.query(
      'SELECT COUNT(*)::int AS likes FROM user_album_likes WHERE album_id = $1',
      [albumId]
    );

    const count = rows[0]?.likes ?? 0;

    try {
      await this._cache.set(key, String(count), 1800);
    } catch (err) {
      console.error('[Redis Error] Gagal menyimpan cache:', err.message);
    }

    return { count, fromCache: false };
  }
}

module.exports = AlbumLikesService;
