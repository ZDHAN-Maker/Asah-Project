const redis = require('redis');

class CacheService {
  constructor() {
    const host = process.env.REDIS_SERVER || '127.0.0.1';

    // Socket mode (kriteria Dicoding) + hentikan auto-retry
    this._client = redis.createClient({
      socket: {
        host,
        port: 6379,
        // stop reconnect loops yang bikin lambat
        reconnectStrategy: () => false,
        connectTimeout: 500, // cepat gagal kalau tidak ada Redis
      },
      // perintah jangan gantung lama
      disableOfflineQueue: true,
    });

    // fallback in-memory cache (key -> { value, expMs })
    this._mem = new Map();

    this._ready = false;
    this._setup();
  }

  _setup() {
    this._client.on('ready', () => {
      this._ready = true;
      console.log('[Redis] connected (socket mode)');
    });

    this._client.on('end', () => {
      this._ready = false;
      console.warn('[Redis] disconnected - using in-memory cache');
    });

    this._client.on('error', (err) => {
      if (err?.code === 'ECONNREFUSED') {
        console.warn('[Redis] ECONNREFUSED 127.0.0.1:6379 - using in-memory cache');
      } else {
        console.warn('[Redis] error:', err?.message || err);
      }
      this._ready = false;
    });

    // Satu kali connect; kalau gagal, pakai memcache
    this._client.connect().catch(() => {
      this._ready = false;
      // no throw: biarkan app tetap jalan pakai memcache
    });
  }

  // ===== in-memory helpers =====
  _memGet(key) {
    const obj = this._mem.get(key);
    if (!obj) return null;
    if (Date.now() > obj.expMs) {
      this._mem.delete(key);
      return null;
    }
    return obj.value;
  }

  _memSet(key, value, ttlSec) {
    this._mem.set(key, { value, expMs: Date.now() + ttlSec * 1000 });
  }

  _memDel(key) {
    this._mem.delete(key);
  }

  // ===== Public API =====
  async set(key, value, expirationInSecond = 1800) {
    // selalu set ke memory dulu (supaya cepat)
    this._memSet(key, value, expirationInSecond);

    if (!this._ready) return; // Redis mati: selesai
    try {
      await this._client.set(key, value, { EX: expirationInSecond });
    } catch (_) {
      // diam: fallback mem sudah terisi
    }
  }

  async get(key) {
    // coba Redis hanya jika ready
    if (this._ready) {
      try {
        const v = await this._client.get(key);
        if (v !== null) return v;
      } catch (_) {
        // diam dan lanjut ke memcache
      }
    }
    const mv = this._memGet(key);
    return mv === null ? null : mv;
  }

  async delete(key) {
    // hapus keduanya
    this._memDel(key);
    if (!this._ready) return;
    try {
      await this._client.del(key);
    } catch (_) {
      // diam
    }
  }
}

module.exports = CacheService;
