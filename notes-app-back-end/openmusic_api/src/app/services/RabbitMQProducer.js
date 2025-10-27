// src/app/services/RabbitMQProducer.js
const amqp = require('amqplib');

class RabbitMQProducer {
  constructor() {
    this._conn = null;
    this._chan = null;
    this._queue = 'export:playlists';
    this._url = process.env.RABBITMQ_SERVER;
  }

  async _ensure() {
    if (this._chan) return;
    this._conn = await amqp.connect(this._url);
    this._chan = await this._conn.createChannel();
    await this._chan.assertQueue(this._queue, { durable: true });
  }

  async sendExportPlaylist(payload) {
    await this._ensure();
    this._chan.sendToQueue(this._queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
  }
}
module.exports = RabbitMQProducer;
