require('dotenv').config();
const amqp = require('amqplib');
const NoteService = require('./Noteservice');
const MailSender = require('./MailSender');
const Listener = require('./listener');

const init = async () => {
  const noteService = new NoteService();
  const mailSender = new MailSender();
  const listener = new Listener(noteService, mailSender);

  const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
  const channel = await connection.createChannel();

  await channel.assertQueue('export:playlists', { durable: true });
  channel.consume('export:playlists', listener.listen, { noAck: true });
};

init();
