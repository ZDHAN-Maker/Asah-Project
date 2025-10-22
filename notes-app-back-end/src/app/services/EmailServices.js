const amqp = require('amqplib');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getPlaylistDataFromDatabase(playlistId) {
  const playlistQuery = `
    SELECT p.id, p.name, u.username
    FROM playlists p
    JOIN users u ON u.id = p.owner
    WHERE p.id = $1
  `;
  const songsQuery = `
    SELECT s.id, s.title, s.performer
    FROM playlist_songs ps
    JOIN songs s ON s.id = ps.song_id
    WHERE ps.playlist_id = $1
  `;

  const playlistRes = await pool.query(playlistQuery, [playlistId]);
  if (playlistRes.rowCount === 0) throw new Error('Playlist tidak ditemukan');

  const songsRes = await pool.query(songsQuery, [playlistId]);

  return {
    id: playlistRes.rows[0].id,
    name: playlistRes.rows[0].name,
    username: playlistRes.rows[0].username,
    songs: songsRes.rows,
  };
}

async function sendEmail(playlistData, targetEmail) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: targetEmail,
    subject: `Export Playlist: ${playlistData.name}`,
    text: JSON.stringify(playlistData, null, 2),
  };

  await transporter.sendMail(mailOptions);
  console.log('Export email sent to ' + targetEmail);
}

async function listenForPlaylistExportRequests() {
  const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
  const channel = await connection.createChannel();
  const queue = 'playlistExportQueue';

  await channel.assertQueue(queue, { durable: true });

  console.log('Waiting for export requests...');
  channel.consume(
    queue,
    async (msg) => {
      const { playlistId, targetEmail } = JSON.parse(msg.content.toString());

      const playlistData = await getPlaylistDataFromDatabase(playlistId);
      await sendEmail(playlistData, targetEmail);

      channel.ack(msg);
    },
    { noAck: false }
  );
}

module.exports = { listenForPlaylistExportRequests };
