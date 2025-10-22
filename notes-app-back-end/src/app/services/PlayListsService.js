const { nanoid } = require('nanoid');
const amqp = require('amqplib');
require('dotenv').config();

const pool = require('../db/index');
const NotFoundError = require('../utils/error/NotFoundError');
const ClientError = require('../utils/error/ClientError');
const AuthorizationError = require('../utils/error/AuthorizationError');

class PlaylistsService {
  constructor(collaborationsService) {
    this._collaborationsService = collaborationsService;
  }

  async verifyPlaylistOwner(playlistId, ownerId) {
    const result = await pool.query('SELECT owner FROM playlists WHERE id = $1', [playlistId]);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];
    if (playlist.owner !== ownerId) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }

    return true;
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw new AuthorizationError('Anda tidak memiliki akses ke playlist ini');
      }
    }
  }

  async verifyCollaborator(playlistId, userId) {
    const result = await pool.query(
      'SELECT id FROM collaborations WHERE playlist_id = $1 AND user_id = $2',
      [playlistId, userId]
    );

    if (result.rowCount === 0) {
      throw new AuthorizationError('Anda bukan kolaborator di playlist ini');
    }
  }

  async create({ name, owner }) {
    if (!name || !owner) {
      throw new ClientError('Name and owner are required', 400);
    }

    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3)',
      values: [id, name, owner],
    };

    const result = await pool.query(query);
    if (result.rowCount === 0) throw new ClientError('Gagal membuat playlist', 400);

    return id;
  }

  async getForUser(userId) {
    const query = `
      SELECT p.id, p.name, u.username
      FROM playlists p
      JOIN users u ON u.id = p.owner
      WHERE p.owner = $1
      UNION
      SELECT p.id, p.name, u.username
      FROM collaborations c
      JOIN playlists p ON p.id = c.playlist_id
      JOIN users u ON u.id = p.owner
      WHERE c.user_id = $1
      ORDER BY name ASC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  async verifyAccess(playlistId, userId) {
    const ownerRes = await pool.query('SELECT 1 FROM playlists WHERE id = $1 AND owner = $2', [
      playlistId,
      userId,
    ]);
    if (ownerRes.rowCount > 0) return true;

    const collabRes = await pool.query(
      'SELECT 1 FROM collaborations WHERE playlist_id = $1 AND user_id = $2',
      [playlistId, userId]
    );
    if (collabRes.rowCount > 0) return true;

    throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
  }

  async delete(playlistId, userId) {
    const check = await pool.query('SELECT owner FROM playlists WHERE id = $1', [playlistId]);
    if (check.rowCount === 0) throw new NotFoundError('Playlist tidak ditemukan');
    if (check.rows[0].owner !== userId) {
      throw new AuthorizationError('Anda tidak berhak mengakses playlist ini');
    }

    await pool.query('DELETE FROM playlist_activities WHERE playlist_id = $1', [playlistId]);
    await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1', [playlistId]);
    await pool.query('DELETE FROM playlists WHERE id = $1', [playlistId]);
  }

  async addSong(playlistId, songId, userId) {
    await this.verifyAccess(playlistId, userId);

    const songCheck = await pool.query('SELECT id FROM songs WHERE id = $1', [String(songId)]);
    if (songCheck.rowCount === 0) throw new NotFoundError('Lagu tidak ditemukan');

    const id = `ps-${nanoid(16)}`;
    await pool.query('INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES ($1, $2, $3)', [
      id,
      playlistId,
      String(songId),
    ]);

    const actId = `act-${nanoid(16)}`;
    await pool.query(
      'INSERT INTO playlist_activities (id, playlist_id, song_id, user_id, action, time) VALUES ($1, $2, $3, $4, $5, NOW())',
      [actId, playlistId, String(songId), userId, 'add']
    );
  }

  async getSongs(playlistId, userId) {
    const metaQ = `
      SELECT p.id, p.name, u.username
      FROM playlists p
      JOIN users u ON u.id = p.owner
      WHERE p.id = $1
    `;
    const metaRes = await pool.query(metaQ, [playlistId]);
    if (metaRes.rowCount === 0) throw new NotFoundError('Playlist tidak ditemukan');

    await this.verifyAccess(playlistId, userId);

    const songsQ = `
      SELECT s.id, s.title, s.performer
      FROM playlist_songs ps
      JOIN songs s ON s.id = ps.song_id
      WHERE ps.playlist_id = $1
      ORDER BY s.title ASC
    `;
    const songsRes = await pool.query(songsQ, [playlistId]);

    return {
      data: {
        playlist: {
          id: metaRes.rows[0].id,
          name: metaRes.rows[0].name,
          username: metaRes.rows[0].username,
          songs: songsRes.rows,
        },
      },
    };
  }

  async deleteSong(playlistId, songId, userId) {
    const playlistCheck = await pool.query('SELECT id FROM playlists WHERE id = $1', [playlistId]);
    if (playlistCheck.rowCount === 0) throw new NotFoundError('Playlist tidak ditemukan');

    await this.verifyAccess(playlistId, userId);

    const songExist = await pool.query('SELECT id FROM songs WHERE id = $1', [String(songId)]);
    if (songExist.rowCount === 0) throw new NotFoundError('Lagu tidak ditemukan');

    const linkCheck = await pool.query(
      'SELECT id FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlistId, String(songId)]
    );

    if (linkCheck.rowCount === 0) {
      console.warn(`Song ${songId} not found in playlist ${playlistId}, but continuing as success`);
      return;
    }

    await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2', [
      playlistId,
      String(songId),
    ]);

    const actId = `act-${nanoid(16)}`;
    await pool.query(
      'INSERT INTO playlist_activities (id, playlist_id, song_id, user_id, action, time) VALUES ($1, $2, $3, $4, $5, NOW())',
      [actId, playlistId, String(songId), userId, 'delete']
    );
  }

  async getActivities(playlistId, userId) {
    const check = await pool.query('SELECT id FROM playlists WHERE id = $1', [playlistId]);
    if (check.rowCount === 0) throw new NotFoundError('Playlist tidak ditemukan');

    await this.verifyAccess(playlistId, userId);

    const q = `
      SELECT u.username, s.title, pa.action, pa.time
      FROM playlist_activities pa
      JOIN users u ON u.id = pa.user_id
      JOIN songs s ON s.id = pa.song_id
      WHERE pa.playlist_id = $1
      ORDER BY pa.time ASC
    `;
    const { rows } = await pool.query(q, [playlistId]);

    return rows.map((r) => ({
      username: r.username,
      title: r.title,
      action: r.action,
      time: r.time,
    }));
  }

  async exportPlaylist(playlistId, targetEmail) {
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
    const channel = await connection.createChannel();
    const queue = 'playlistExportQueue';

    await channel.assertQueue(queue, { durable: true });
    const message = JSON.stringify({ playlistId, targetEmail });
    channel.sendToQueue(queue, Buffer.from(message), { persistent: true });

    console.log(`Export request sent for Playlist ID: ${playlistId}`);

    setTimeout(() => {
      channel.close();
      connection.close();
    }, 500);
  }
}

module.exports = PlaylistsService;
