// app/services/CacheService.js
const redis = require('redis');

class CacheService {
  constructor(client) {
    this._client = client;
  }

  static async create() {
    const host = process.env.REDIS_SERVER || '127.0.0.1';
    const port = Number(process.env.REDIS_PORT || '6379');
    const password = process.env.REDIS_PASSWORD;

    const url = password
      ? `redis://:${encodeURIComponent(password)}@${host}:${port}`
      : `redis://${host}:${port}`;

    const client = redis.createClient({
      url,
      socket: {
        family: 4,
        connectTimeout: 10000,
        reconnectStrategy: (retries) => Math.min(1000 * retries, 10000),
      },
    });

    client.on('error', (err) => {
      console.error('[Redis Error]', err.message);
    });

    await client.connect();
    await client.ping();

    return new CacheService(client);
  }

  async set(key, value, expirationInSeconds = 1800) {
    // default 30 menit
    await this._client.set(key, value, { EX: expirationInSeconds });
  }

  async get(key) {
    return this._client.get(key); // kembalikan null bila tak ada
  }

  async delete(key) {
    return this._client.del(key);
  }

  async close() {
    await this._client.quit();
  }
}

module.exports = CacheService;
