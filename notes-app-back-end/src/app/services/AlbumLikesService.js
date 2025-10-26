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
    const already = await this.checkUserLike(albumId, userId);
    if (already) {
      const err = new Error('Anda sudah menyukai album ini');
      err.statusCode = 400;
      throw err;
    }

    await this._pool.query('INSERT INTO user_album_likes (album_id, user_id) VALUES ($1, $2)', [
      albumId,
      userId,
    ]);

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
    const cached = await this._cache.get(key);

    if (cached !== null) {
      return { count: Number(cached), fromCache: true };
    }

    const { rows } = await this._pool.query(
      'SELECT COUNT(*)::int AS likes FROM user_album_likes WHERE album_id = $1',
      [albumId]
    );

    const count = rows[0]?.likes ?? 0;
    await this._cache.set(key, String(count), 1800);

    return { count, fromCache: false };
  }
}

module.exports = AlbumLikesService;
