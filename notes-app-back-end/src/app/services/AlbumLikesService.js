const { nanoid } = require('nanoid');
const { createClient } = require('redis');
const NotFoundError = require('../utils/error/NotFoundError');

class AlbumLikesService {
  constructor(pool) {
    this._pool = pool;

    // === Redis via SOCKET (sesuai materi Dicoding) ===
    const host = process.env.REDIS_SERVER || '127.0.0.1';
    this._redis = createClient({ socket: { host, port: 6379 } });
    this._redisReady = false;

    this._redis.on('error', (err) => {
      console.error('[Redis] connection error:', err?.message || err);
      this._redisReady = false;
    });

    this._redis.connect()
      .then(() => { this._redisReady = true; })
      .catch((err) => {
        console.error('[Redis] connect failed:', err?.message || err);
        this._redisReady = false;
      });
  }

  async _safeGet(key) {
    if (!this._redisReady) return null;
    try { return await this._redis.get(key); }
    catch (err) { console.error('Redis get error:', err.message); return null; }
  }

  async _safeSetEx(key, ttl, value) {
    if (!this._redisReady) return;
    try { await this._redis.setEx(key, ttl, value); }
    catch (err) { console.error('Redis setEx error:', err.message); }
  }

  async _safeDel(key) {
    if (!this._redisReady) return;
    try { await this._redis.del(key); }
    catch (err) { console.error('Redis del error:', err.message); }
  }

  async checkUserLike(albumId, userId) {
    const q = { text: 'SELECT 1 FROM user_album_likes WHERE album_id=$1 AND user_id=$2 LIMIT 1', values: [albumId, userId] };
    const r = await this._pool.query(q);
    return r.rowCount > 0;
  }

  async likeAlbum(albumId, userId) {
    const a = await this._pool.query('SELECT id FROM albums WHERE id=$1', [albumId]);
    if (!a.rowCount) throw new NotFoundError('Album tidak ditemukan');

    if (await this.checkUserLike(albumId, userId)) {
      const err = new Error('User sudah menyukai album ini');
      err.code = 'DUPLICATE_LIKE';
      throw err;
    }

    const id = `like-${nanoid(16)}`;
    await this._pool.query({
      text: 'INSERT INTO user_album_likes(id, album_id, user_id) VALUES($1,$2,$3)',
      values: [id, albumId, userId],
    });

    await this._safeDel(`album_likes:${albumId}`);
    return id;
  }

  async unlikeAlbum(albumId, userId) {
    const r = await this._pool.query({
      text: 'DELETE FROM user_album_likes WHERE album_id=$1 AND user_id=$2 RETURNING id',
      values: [albumId, userId],
    });
    if (!r.rowCount) throw new NotFoundError('Like tidak ditemukan');
    await this._safeDel(`album_likes:${albumId}`);
  }

  async getLikesCount(albumId) {
    const a = await this._pool.query('SELECT id FROM albums WHERE id=$1', [albumId]);
    if (!a.rowCount) throw new NotFoundError('Album tidak ditemukan');

    const key = `album_likes:${albumId}`;
    const cached = await this._safeGet(key);
    if (cached !== null) {
      return { count: parseInt(cached, 10), fromCache: true };
    }

    const r = await this._pool.query({
      text: 'SELECT COUNT(*)::int AS c FROM user_album_likes WHERE album_id=$1',
      values: [albumId],
    });
    const count = r.rows[0]?.c ?? 0;
    await this._safeSetEx(key, 1800, String(count)); // 30 menit
    return { count, fromCache: false };
  }
}

module.exports = AlbumLikesService;
