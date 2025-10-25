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
    this._connecting = false;
  }

  /** Koneksi RabbitMQ (singleton agar tidak double connect) */
  async connectToRabbitMQ() {
    if (this._channel || this._connecting) return;

    try {
      this._connecting = true;
      const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
      this._amqpConn = await amqp.connect(rabbitUrl);
      this._channel = await this._amqpConn.createChannel();

      await this._channel.assertQueue('export:playlists', { durable: true });
      console.log('✅ RabbitMQ connected');
    } catch (error) {
      console.error('❌ Error connecting to RabbitMQ:', error);
      throw new ClientError('Gagal koneksi ke RabbitMQ');
    } finally {
      this._connecting = false;
    }
  }

  async close() {
    if (this._channel) await this._channel.close();
    if (this._amqpConn) await this._amqpConn.close();
  }

  async verifyPlaylistForExport(playlistId, userId) {
    const result = await pool.query('SELECT id, owner FROM playlists WHERE id = $1', [playlistId]);
    if (!result.rowCount) throw new NotFoundError('Playlist tidak ditemukan');

    await this.verifyPlaylistAccess(playlistId, userId);
    return result.rows[0];
  }

  /** Kirim permintaan export ke RabbitMQ */
  async exportPlaylist(playlistId, userId, targetEmail = null) {
    try {
      await this.verifyPlaylistAccess(playlistId, userId);

      if (targetEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(targetEmail)) {
          throw new InvariantError('targetEmail harus berupa email yang valid');
        }
      }

      if (!this._channel) {
        await this.connectToRabbitMQ();
      }

      const payload = {
        playlistId,
        targetEmail,
        userId,
        timestamp: new Date().toISOString(),
      };

      await this._channel.sendToQueue('export:playlists', Buffer.from(JSON.stringify(payload)), {
        persistent: true,
      });

      return {
        status: 'success',
        message: 'Permintaan export playlist telah dimasukkan ke antrian',
      };
    } catch (error) {
      console.error('Error in exportPlaylist:', error);
      if (
        error instanceof NotFoundError
        || error instanceof AuthorizationError
        || error instanceof InvariantError
      ) {
        throw error;
      }
      throw new ClientError('Gagal memulai export playlist');
    }
  }

  /** Verifikasi pemilik playlist */
  async verifyPlaylistOwner(playlistId, ownerId) {
    const result = await pool.query('SELECT id, owner FROM playlists WHERE id = $1', [playlistId]);
    if (!result.rowCount) throw new NotFoundError('Playlist tidak ditemukan');

    const playlist = result.rows[0];
    if (playlist.owner !== ownerId) {
      throw new AuthorizationError('Anda tidak berhak mengakses playlist ini');
    }

    return playlist;
  }

  /** Verifikasi akses playlist (owner / kolaborator) */
  async verifyPlaylistAccess(playlistId, userId) {
    const result = await pool.query('SELECT id, owner FROM playlists WHERE id = $1', [playlistId]);
    if (!result.rowCount) throw new NotFoundError('Playlist tidak ditemukan');

    const playlist = result.rows[0];
    if (playlist.owner === userId) return playlist;

    try {
      await this._collaborationsService.verifyCollaborator(playlistId, userId);
      return playlist;
    } catch (err) {
      throw new AuthorizationError('Anda tidak memiliki akses ke playlist ini');
    }
  }

  /** Buat playlist baru */
  async create({ name, owner }) {
    if (!name || !owner) {
      throw new InvariantError('Name dan owner wajib diisi');
    }

    const id = `playlist-${nanoid(16)}`;
    const result = await pool.query(
      'INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3) RETURNING id',
      [id, name, owner]
    );

    if (!result.rows[0]) {
      throw new InvariantError('Gagal membuat playlist');
    }

    return result.rows[0].id;
  }

  /** Ambil semua playlist milik user / kolaborator */
  async getForUser(userId) {
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
  }

  /** Hapus playlist (beserta data terkait) */
  async delete(playlistId, userId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await this.verifyPlaylistOwner(playlistId, userId);

      const tables = ['playlist_song_activities', 'playlist_songs', 'collaborations'];

      // Jalankan penghapusan paralel menggunakan array iteration
      await Promise.all(
        tables.map((table) => {
          return client
            .query(`DELETE FROM ${table} WHERE playlist_id = $1`, [playlistId])
            .catch((err) => {
              console.warn(`⚠️ Skip delete ${table}: ${err.message}`);
            });
        })
      );

      const result = await client.query('DELETE FROM playlists WHERE id = $1 RETURNING id', [
        playlistId,
      ]);

      if (!result.rowCount) {
        throw new NotFoundError('Playlist tidak ditemukan saat penghapusan');
      }

      await client.query('COMMIT');
      return result.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');

      if (
        error instanceof NotFoundError
        || error instanceof AuthorizationError
        || error instanceof ClientError
      ) {
        throw error;
      }

      throw new ClientError(`Gagal menghapus playlist: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Helper untuk menghapus data dari tabel terkait.
   * Tujuannya supaya tidak ada "await inside loop" langsung di fungsi utama.
   */
  async _deleteFromTable(client, tableName, playlistId) {
    try {
      await client.query(`DELETE FROM ${tableName} WHERE playlist_id = $1`, [playlistId]);
    } catch (err) {
      console.warn(`⚠️ Skip delete ${tableName}: ${err.message}`);
    }
  }

  /** Tambah lagu ke playlist */
  async addSong(playlistId, songId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await this.verifyPlaylistAccess(playlistId, userId);

      const songCheck = await client.query('SELECT id FROM songs WHERE id = $1', [songId]);
      if (!songCheck.rowCount) throw new NotFoundError('Lagu tidak ditemukan di database');

      const exists = await client.query(
        'SELECT id FROM playlist_songs WHERE playlist_id=$1 AND song_id=$2',
        [playlistId, songId]
      );
      if (exists.rowCount > 0) throw new InvariantError('Lagu sudah ada di playlist');

      const playlistSongId = `ps-${nanoid(16)}`;
      await client.query(
        'INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES ($1, $2, $3)',
        [playlistSongId, playlistId, songId]
      );

      const actId = `act-${nanoid(16)}`;
      await client.query(
        `INSERT INTO playlist_song_activities 
         (id, playlist_id, song_id, user_id, action, time) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [actId, playlistId, songId, userId, 'add']
      );

      await client.query('COMMIT');
      return playlistSongId;
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof ClientError) throw error;
      throw new ClientError(`Gagal menambah lagu: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /** Ambil lagu di playlist */
  async getSongs(playlistId, userId) {
    await this.verifyPlaylistAccess(playlistId, userId);

    const meta = await pool.query(
      `SELECT p.id, p.name, u.username 
       FROM playlists p 
       JOIN users u ON u.id = p.owner 
       WHERE p.id = $1`,
      [playlistId]
    );

    if (!meta.rowCount) throw new NotFoundError('Playlist tidak ditemukan');

    const songs = await pool.query(
      `SELECT s.id, s.title, s.performer 
       FROM playlist_songs ps 
       JOIN songs s ON s.id = ps.song_id 
       WHERE ps.playlist_id = $1 
       ORDER BY s.title ASC`,
      [playlistId]
    );

    return {
      data: {
        playlist: {
          id: meta.rows[0].id,
          name: meta.rows[0].name,
          username: meta.rows[0].username,
          songs: songs.rows,
        },
      },
    };
  }

  /** Hapus lagu dari playlist */
  async deleteSong(playlistId, songId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await this.verifyPlaylistAccess(playlistId, userId);

      const exists = await client.query(
        'SELECT id FROM playlist_songs WHERE playlist_id=$1 AND song_id=$2',
        [playlistId, songId]
      );

      if (!exists.rowCount) {
        throw new NotFoundError('Lagu tidak ditemukan di playlist');
      }

      const deleted = await client.query(
        'DELETE FROM playlist_songs WHERE playlist_id=$1 AND song_id=$2 RETURNING id',
        [playlistId, songId]
      );

      const actId = `act-${nanoid(16)}`;
      await client.query(
        `INSERT INTO playlist_song_activities 
         (id, playlist_id, song_id, user_id, action, time) 
         VALUES ($1,$2,$3,$4,$5,NOW())`,
        [actId, playlistId, songId, userId, 'delete']
      );

      await client.query('COMMIT');
      return deleted.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof ClientError) throw error;
      throw new ClientError(`Gagal menghapus lagu: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /** Ambil aktivitas playlist */
  async getActivities(playlistId, userId) {
    await this.verifyPlaylistAccess(playlistId, userId);
    const { rows } = await pool.query(
      `SELECT u.username, s.title, pa.action, pa.time
       FROM playlist_song_activities pa
       JOIN users u ON u.id = pa.user_id
       JOIN songs s ON s.id = pa.song_id
       WHERE pa.playlist_id = $1 
       ORDER BY pa.time ASC`,
      [playlistId]
    );
    return rows;
  }
}

module.exports = PlaylistsService;
