require('dotenv').config();
const amqp = require('amqplib');
const PlaylistsService = require('./ExportPlaylistsService');
const MailSender = require('./MailSender');
const Listener = require('./Listener');

const init = async () => {
  try {
    const playlistsService = new PlaylistsService();
    const mailSender = new MailSender();
    const listener = new Listener(playlistsService, mailSender);

    const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
    const channel = await connection.createChannel();

    await channel.assertQueue('export:playlists', { durable: true });
    channel.consume('export:playlists', listener.listen, { noAck: true });

    console.log('✅ Consumer is listening for export:playlists queue...');
  } catch (error) {
    console.error('❌ Failed to start consumer:', error);
  }
};

init();
