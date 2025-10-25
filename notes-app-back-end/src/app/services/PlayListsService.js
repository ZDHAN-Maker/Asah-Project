const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const amqp = require('amqplib');
require('dotenv').config();

const NotFoundError = require('../utils/error/NotFoundError');
const ClientError = require('../utils/error/ClientError');
const AuthorizationError = require('../utils/error/AuthorizationError');
const InvariantError = require('../utils/error/InvariantError');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
});

class PlaylistsService {
  constructor(collaborationsService) {
    this._collaborationsService = collaborationsService;
    this._amqpConn = null;
    this._channel = null;
  }

  // Function to connect to RabbitMQ
  async connectToRabbitMQ() {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
      this._amqpConn = await amqp.connect(rabbitUrl);
      this._channel = await this._amqpConn.createChannel();

      await this._channel.assertQueue('export:playlists', {
        durable: true, // Ensure the queue survives server restarts
      });
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      throw new ClientError('Failed to connect to RabbitMQ');
    }
  }

  async close() {
    if (this._channel) {
      await this._channel.close();
    }
    if (this._amqpConn) {
      await this._amqpConn.close();
    }
  }

  async verifyPlaylistForExport(playlistId, userId) {
    try {
      // Check if playlist exists
      const playlistQuery = await pool.query('SELECT id, owner FROM playlists WHERE id = $1', [
        playlistId,
      ]);

      if (!playlistQuery.rowCount) {
        throw new NotFoundError('Playlist tidak ditemukan');
      }

      // Verify user has access (owner or collaborator)
      await this.verifyPlaylistAccess(playlistId, userId);

      return playlistQuery.rows[0];
    } catch (error) {
      if (error instanceof ClientError) throw error;
      console.error('Error in verifyPlaylistForExport:', error);
      throw new ClientError('Terjadi kesalahan saat memverifikasi playlist');
    }
  }

  // Function to send the export playlist request to the queue
  // Function to send the export playlist request to the queue
  async exportPlaylist(playlistId, userId, targetEmail = null) {
    try {
      // Verify playlist access first
      await this.verifyPlaylistAccess(playlistId, userId);

      // Validate targetEmail if provided
      if (targetEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(targetEmail)) {
          throw new InvariantError('targetEmail harus berupa email yang valid');
        }
      }

      // Ensure the RabbitMQ connection is active
      if (!this._channel) {
        await this.connectToRabbitMQ();
      }

      // Prepare the message payload
      const payload = {
        playlistId,
        targetEmail,
        userId, // Tambahkan userId untuk tracking
        timestamp: new Date().toISOString(),
      };

      // Publish the export request to the queue
      await this._channel.sendToQueue('export:playlists', Buffer.from(JSON.stringify(payload)), {
        persistent: true,
      });

      console.log(`Playlist export request for ${playlistId} sent to the queue by user ${userId}`);

      // Return success response
      return {
        status: 'success',
        message: 'Permintaan export dalam antrian',
      };
    } catch (error) {
      console.error('Error in exportPlaylist:', error);

      // Re-throw specific errors - PERBAIKAN: Tambahkan operator OR yang benar
      if (error instanceof NotFoundError) {
        throw error;
      } else if (error instanceof AuthorizationError) {
        throw error;
      } else if (error instanceof InvariantError) {
        throw error;
      }

      throw new ClientError('Gagal memulai export playlist');
    }
  }

  // Function to verify playlist owner
  async verifyPlaylistOwner(playlistId, ownerId) {
    try {
      const result = await pool.query('SELECT owner FROM playlists WHERE id = $1', [playlistId]);

      if (!result.rowCount) {
        throw new NotFoundError('Playlist tidak ditemukan');
      }
      if (result.rows[0].owner !== ownerId) {
        throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
      }
    } catch (error) {
      if (error instanceof ClientError) throw error;
      console.error('Error in verifyPlaylistOwner:', error);
      throw new ClientError('Terjadi kesalahan saat memverifikasi playlist');
    }
  }

  // Function to verify playlist access (both owner and collaborator)
  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error instanceof AuthorizationError) {
        try {
          await this._collaborationsService.verifyCollaborator(playlistId, userId);
        } catch (collabErr) {
          throw new AuthorizationError('Anda tidak memiliki akses ke playlist ini');
        }
      } else {
        throw error;
      }
    }
  }

  // Function to create a new playlist
  async create({ name, owner }) {
    try {
      if (!name || !owner) throw new InvariantError('Name and owner are required');

      const id = `playlist-${nanoid(16)}`;
      const query = {
        text: 'INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3) RETURNING id',
        values: [id, name, owner],
      };

      const result = await pool.query(query);
      return result.rows[0].id;
    } catch (error) {
      console.error('Error in create playlist:', error);
      if (error instanceof ClientError) throw error;
      throw new ClientError('Gagal membuat playlist');
    }
  }

  // Function to get playlists for a user (either owned or collaborated)
  async getForUser(userId) {
    try {
      const query = `
        SELECT DISTINCT p.id, p.name, u.username
        FROM playlists p
        LEFT JOIN collaborations c ON p.id = c.playlist_id
        JOIN users u ON u.id = p.owner
        WHERE p.owner = $1 OR c.user_id = $1
        ORDER BY p.name ASC
      `;
      const { rows } = await pool.query(query, [userId]);
      return rows;
    } catch (error) {
      console.error('Error in getForUser:', error);
      throw new ClientError('Gagal mengambil data playlists');
    }
  }

  // Function to delete a playlist
  async delete(playlistId, userId) {
    try {
      const check = await pool.query('SELECT owner FROM playlists WHERE id = $1', [playlistId]);

      if (!check.rowCount) throw new NotFoundError('Playlist tidak ditemukan');
      if (check.rows[0].owner !== userId) {
        throw new AuthorizationError('Anda tidak berhak mengakses playlist ini');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query('DELETE FROM playlist_song_activities WHERE playlist_id = $1', [
          playlistId,
        ]);
        await client.query('DELETE FROM playlist_songs WHERE playlist_id = $1', [playlistId]);
        await client.query('DELETE FROM collaborations WHERE playlist_id = $1', [playlistId]);

        const delRes = await client.query('DELETE FROM playlists WHERE id = $1 RETURNING id', [
          playlistId,
        ]);
        if (!delRes.rowCount) {
          await client.query('ROLLBACK');
          throw new NotFoundError('Playlist tidak ditemukan saat penghapusan');
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in delete playlist:', error);
      if (error instanceof ClientError) throw error;
      throw new ClientError('Gagal menghapus playlist');
    }
  }

  // Function to add a song to a playlist
  async addSong(playlistId, songId, userId) {
    try {
      await this.verifyPlaylistAccess(playlistId, userId);

      if (!songId) throw new InvariantError('songId is required');

      const songCheck = await pool.query('SELECT id FROM songs WHERE id = $1', [String(songId)]);
      if (!songCheck.rowCount) throw new NotFoundError('Lagu tidak ditemukan');

      const existingSong = await pool.query(
        'SELECT id FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
        [playlistId, String(songId)]
      );

      if (existingSong.rowCount > 0) throw new InvariantError('Lagu sudah ada di playlist');

      const id = `ps-${nanoid(16)}`;
      const insertRes = await pool.query(
        'INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES ($1, $2, $3) RETURNING id',
        [id, playlistId, String(songId)]
      );

      if (!insertRes.rowCount) throw new ClientError('Gagal menambahkan lagu ke playlist');

      const actId = `act-${nanoid(16)}`;
      await pool.query(
        'INSERT INTO playlist_song_activities (id, playlist_id, song_id, user_id, action, time) VALUES ($1, $2, $3, $4, $5, NOW())',
        [actId, playlistId, String(songId), userId, 'add']
      );

      return insertRes.rows[0].id;
    } catch (error) {
      console.error('Error in addSong:', error);
      if (error instanceof ClientError) throw error;
      throw new ClientError('Gagal menambahkan lagu ke playlist');
    }
  }

  // Function to get songs from a playlist
  async getSongs(playlistId, userId) {
    try {
      const metaQ = `
        SELECT p.id, p.name, u.username
        FROM playlists p
        JOIN users u ON u.id = p.owner
        WHERE p.id = $1
      `;
      const metaRes = await pool.query(metaQ, [playlistId]);
      if (!metaRes.rowCount) throw new NotFoundError('Playlist tidak ditemukan');

      await this.verifyPlaylistAccess(playlistId, userId);

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
    } catch (error) {
      console.error('Error in getSongs:', error);
      if (error instanceof ClientError) throw error;
      throw new ClientError('Gagal mengambil data songs dari playlist');
    }
  }

  // Function to delete a song from a playlist
  async deleteSong(playlistId, songId, userId) {
    try {
      await this.verifyPlaylistAccess(playlistId, userId);

      if (!songId) throw new InvariantError('songId is required');

      const songExist = await pool.query('SELECT id FROM songs WHERE id = $1', [String(songId)]);
      if (!songExist.rowCount) throw new NotFoundError('Lagu tidak ditemukan');

      const deleteRes = await pool.query(
        'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
        [playlistId, String(songId)]
      );

      if (!deleteRes.rowCount) throw new NotFoundError('Lagu tidak ditemukan dalam playlist');

      const actId = `act-${nanoid(16)}`;
      await pool.query(
        'INSERT INTO playlist_song_activities (id, playlist_id, song_id, user_id, action, time) VALUES ($1, $2, $3, $4, $5, NOW())',
        [actId, playlistId, String(songId), userId, 'delete']
      );

      return deleteRes.rows[0].id;
    } catch (error) {
      console.error('Error in deleteSong:', error);
      if (error instanceof ClientError) throw error;
      throw new ClientError('Gagal menghapus lagu dari playlist');
    }
  }

  // Function to get the activities of a playlist (song add/delete)
  async getActivities(playlistId, userId) {
    try {
      await this.verifyPlaylistAccess(playlistId, userId);

      const q = `
        SELECT u.username, s.title, pa.action, pa.time
        FROM playlist_song_activities pa
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
    } catch (error) {
      console.error('Error in getActivities:', error);
      if (error instanceof ClientError) throw error;
      throw new ClientError('Gagal mengambil data aktivitas playlist');
    }
  }
}

module.exports = PlaylistsService;
