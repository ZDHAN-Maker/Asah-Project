const redis = require('redis');

class CacheService {
  constructor() {
    const host = process.env.REDIS_SERVER;
    if (!host) {
      throw new Error('Environment variable REDIS_SERVER is required');
    }

    this._client = redis.createClient({
      socket: { host },
    });

    this._client.on('error', (err) => {
      console.error('[Redis Error]', err);
    });

    this._client.connect().catch((err) => {
      console.error('Failed to connect to Redis:', err);
    });
  }

  async set(key, value, expirationInSecond = 3600) {
    await this._client.set(key, value, { EX: expirationInSecond });
  }

  async get(key) {
    const result = await this._client.get(key);
    if (result === null) throw new Error('Cache tidak ditemukan');
    return result;
  }

  delete(key) {
    return this._client.del(key);
  }
}

module.exports = CacheService;
