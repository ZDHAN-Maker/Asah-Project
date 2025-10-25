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
        durable: true,
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
      const playlistQuery = await pool.query('SELECT id, owner FROM playlists WHERE id = $1', [
        playlistId,
      ]);

      if (!playlistQuery.rowCount) {
        throw new NotFoundError('Playlist tidak ditemukan');
      }

      await this.verifyPlaylistAccess(playlistId, userId);

      return playlistQuery.rows[0];
    } catch (error) {
      if (error instanceof ClientError) throw error;
      console.error('Error in verifyPlaylistForExport:', error);
      throw new ClientError('Terjadi kesalahan saat memverifikasi playlist');
    }
  }

  // Function to send the export playlist request to the queue
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

      console.log(`Playlist export request for ${playlistId} sent to the queue by user ${userId}`);

      return {
        status: 'success',
        message: 'Permintaan export dalam antrian',
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

  // Function to verify playlist owner
  async verifyPlaylistOwner(playlistId, ownerId) {
    try {
      const result = await pool.query('SELECT id, owner FROM playlists WHERE id = $1', [
        playlistId,
      ]);

      if (!result.rowCount) {
        throw new NotFoundError('Playlist tidak ditemukan');
      }

      const playlist = result.rows[0];
      if (playlist.owner !== ownerId) {
        throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
      }

      return playlist;
    } catch (error) {
      if (error instanceof ClientError) throw error;
      console.error('Error in verifyPlaylistOwner:', error);
      throw new ClientError('Terjadi kesalahan saat memverifikasi playlist');
    }
  }

  // Function to verify playlist access (both owner and collaborator)
  async verifyPlaylistAccess(playlistId, userId) {
    try {
      // Cek apakah playlist exists terlebih dahulu
      const playlistCheck = await pool.query('SELECT id, owner FROM playlists WHERE id = $1', [
        playlistId,
      ]);

      if (!playlistCheck.rowCount) {
        throw new NotFoundError('Playlist tidak ditemukan');
      }

      const playlist = playlistCheck.rows[0];

      // Jika user adalah owner, langsung return
      if (playlist.owner === userId) {
        return playlist;
      }

      // Jika bukan owner, cek apakah collaborator
      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
        return playlist;
      } catch (collabErr) {
        console.log('User is not collaborator, checking error:', collabErr.message);

        // PERBAIKAN: Jika error karena service collaboration, anggap bukan collaborator
        if (
          collabErr.message.includes('prepared statement')
          || collabErr.message.includes('parameter')
        ) {
          console.log('Collaboration service error, assuming user is not collaborator');
          throw new AuthorizationError('Anda tidak memiliki akses ke playlist ini');
        }

        throw new AuthorizationError('Anda tidak memiliki akses ke playlist ini');
      }
    } catch (error) {
      if (error instanceof ClientError) throw error;
      console.error('Error in verifyPlaylistAccess:', error);
      throw new ClientError('Terjadi kesalahan saat memverifikasi akses playlist');
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

      if (!result.rows[0]) {
        throw new InvariantError('Gagal membuat playlist');
      }

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

  // Function to delete a playlist - PERBAIKAN
  // Function to delete a playlist - PERBAIKAN CLEAN ASYNC VERSION
  async delete(playlistId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('=== DEBUG DELETE PLAYLIST ===');
      console.log('Playlist ID:', playlistId);
      console.log('User ID:', userId);

      // Verifikasi ownership
      await this.verifyPlaylistOwner(playlistId, userId);

      // Daftar tabel yang akan dibersihkan
      const tablesToClean = ['playlist_song_activities', 'playlist_songs', 'collaborations'];

      // Jalankan semua query delete secara paralel menggunakan Promise.all()
      const deletePromises = tablesToClean.map(async (table) => {
        try {
          const deleteQuery = `DELETE FROM ${table} WHERE playlist_id = $1`;
          const result = await client.query(deleteQuery, [playlistId]);
          console.log(`Cleaned ${result.rowCount} rows from ${table}`);
        } catch (tableError) {
          console.warn(`Tidak dapat menghapus dari ${table}:`, tableError.message);
          // lanjut ke tabel berikutnya tanpa menghentikan eksekusi
        }
      });

      await Promise.all(deletePromises); // Tunggu semua selesai

      // Hapus playlist utama
      const deleteResult = await client.query('DELETE FROM playlists WHERE id = $1 RETURNING id', [
        playlistId,
      ]);

      if (!deleteResult.rowCount) {
        throw new NotFoundError('Playlist tidak ditemukan saat penghapusan');
      }

      await client.query('COMMIT');
      console.log('Playlist deleted successfully:', deleteResult.rows[0].id);

      return deleteResult.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in delete playlist:', error);

      if (
        error instanceof NotFoundError
        || error instanceof AuthorizationError
        || error instanceof ClientError
      ) {
        throw error;
      }

      console.error('Unexpected error in delete playlist:', error);
      throw new ClientError(`Gagal menghapus playlist: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Function to add a song to a playlist - PERBAIKAN
  async addSong(playlistId, songId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('Adding song to playlist:', { playlistId, songId, userId });

      // Verifikasi akses playlist
      await this.verifyPlaylistAccess(playlistId, userId);

      // Verifikasi song exists di database
      const songCheck = await client.query('SELECT id, title FROM songs WHERE id = $1', [songId]);

      if (!songCheck.rowCount) {
        throw new NotFoundError(`Lagu dengan ID ${songId} tidak ditemukan`);
      }

      console.log('Song found:', songCheck.rows[0].title);

      // Cek apakah lagu sudah ada di playlist
      const existingSong = await client.query(
        'SELECT id FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
        [playlistId, songId]
      );

      if (existingSong.rowCount > 0) {
        throw new InvariantError('Lagu sudah ada di playlist ini');
      }

      // Tambahkan lagu ke playlist
      const playlistSongId = `ps-${nanoid(16)}`;
      const insertRes = await client.query(
        'INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES ($1, $2, $3) RETURNING id',
        [playlistSongId, playlistId, songId]
      );

      if (!insertRes.rowCount) {
        throw new InvariantError('Gagal menambahkan lagu ke playlist');
      }

      // Catat aktivitas
      try {
        const actId = `act-${nanoid(16)}`;
        await client.query(
          `INSERT INTO playlist_song_activities 
           (id, playlist_id, song_id, user_id, action, time) 
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [actId, playlistId, songId, userId, 'add']
        );
        console.log('Activity recorded');
      } catch (activityError) {
        console.warn('Tidak dapat mencatat aktivitas:', activityError.message);
        // Lanjutkan tanpa aktivitas
      }

      await client.query('COMMIT');
      console.log('Song added successfully');

      return insertRes.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in addSong:', error);

      if (error instanceof ClientError) throw error;
      throw new ClientError('Gagal menambahkan lagu ke playlist: ' + error.message);
    } finally {
      client.release();
    }
  }

  async getSongs(playlistId, userId) {
    try {
      console.log('=== DEBUG GET SONGS ===');
      console.log('Playlist ID:', playlistId);
      console.log('User ID:', userId);

      // Verifikasi akses playlist
      await this.verifyPlaylistAccess(playlistId, userId);

      // Ambil metadata playlist
      const metaQ = `
      SELECT p.id, p.name, u.username
      FROM playlists p
      JOIN users u ON u.id = p.owner
      WHERE p.id = $1
    `;
      const metaRes = await pool.query(metaQ, [playlistId]);

      if (!metaRes.rowCount) {
        throw new NotFoundError('Playlist tidak ditemukan');
      }

      console.log('Playlist metadata:', metaRes.rows[0]);

      // DEBUG: Cek data di playlist_songs
      const debugQ = `
      SELECT ps.id as playlist_song_id, ps.playlist_id, ps.song_id, s.title, s.performer
      FROM playlist_songs ps
      LEFT JOIN songs s ON s.id = ps.song_id
      WHERE ps.playlist_id = $1
    `;
      const debugRes = await pool.query(debugQ, [playlistId]);
      console.log('DEBUG - Data di playlist_songs:', debugRes.rows);

      // Ambil songs dari playlist
      const songsQ = `
      SELECT s.id, s.title, s.performer
      FROM playlist_songs ps
      JOIN songs s ON s.id = ps.song_id
      WHERE ps.playlist_id = $1
      ORDER BY s.title ASC
    `;
      const songsRes = await pool.query(songsQ, [playlistId]);

      console.log(`Found ${songsRes.rows.length} songs in playlist ${playlistId}`);
      console.log('Songs:', songsRes.rows);

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
      console.error('Error in getSongs service:', error);
      if (error instanceof ClientError) throw error;
      throw new ClientError('Gagal mengambil data songs dari playlist');
    }
  }

  // Function to delete a song from a playlist - PERBAIKAN
  // Function to delete a song from a playlist - PERBAIKAN COMPLETE
  async deleteSong(playlistId, songId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('=== DEBUG DELETE SONG ===');
      console.log('Playlist ID:', playlistId);
      console.log('Song ID:', songId);
      console.log('User ID:', userId);

      // Verifikasi akses playlist
      await this.verifyPlaylistAccess(playlistId, userId);

      // DEBUG 1: Cek apakah playlist ada
      const playlistCheck = await client.query('SELECT id, name FROM playlists WHERE id = $1', [
        playlistId,
      ]);
      console.log('Playlist check:', playlistCheck.rows[0]);

      if (!playlistCheck.rowCount) {
        throw new NotFoundError(`Playlist dengan ID ${playlistId} tidak ditemukan`);
      }

      // DEBUG 2: Cek apakah song ada di database
      const songCheck = await client.query('SELECT id, title FROM songs WHERE id = $1', [songId]);
      console.log('Song check in database:', songCheck.rows[0]);

      if (!songCheck.rowCount) {
        throw new NotFoundError(`Lagu dengan ID ${songId} tidak ditemukan di database`);
      }

      // DEBUG 3: Cek data di playlist_songs sebelum menghapus
      const checkInPlaylist = await client.query(
        `SELECT ps.id, ps.playlist_id, ps.song_id, s.title 
       FROM playlist_songs ps 
       JOIN songs s ON ps.song_id = s.id 
       WHERE ps.playlist_id = $1 AND ps.song_id = $2`,
        [playlistId, songId]
      );

      console.log('Data di playlist_songs sebelum delete:', checkInPlaylist.rows);

      if (!checkInPlaylist.rowCount) {
        throw new NotFoundError(
          `Lagu "${songCheck.rows[0]?.title || songId}" tidak ditemukan dalam playlist "${playlistCheck.rows[0]?.name || playlistId}"`
        );
      }

      console.log('Song to delete found:', checkInPlaylist.rows[0].title);

      // Hapus lagu dari playlist
      const deleteRes = await client.query(
        'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
        [playlistId, songId]
      );

      console.log('Delete result:', deleteRes.rows);

      if (!deleteRes.rowCount) {
        throw new NotFoundError(
          'Gagal menghapus lagu dari playlist - tidak ada baris yang terhapus'
        );
      }

      // Catat aktivitas (optional - skip jika error)
      try {
        const actId = `act-${nanoid(16)}`;
        await client.query(
          `INSERT INTO playlist_song_activities 
         (id, playlist_id, song_id, user_id, action, time) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
          [actId, playlistId, songId, userId, 'delete']
        );
        console.log('Delete activity recorded successfully');
      } catch (activityError) {
        console.warn('Tidak dapat mencatat aktivitas delete:', activityError.message);
        // Lanjutkan tanpa aktivitas - jangan rollback
      }

      await client.query('COMMIT');
      console.log('Song deleted successfully from playlist');

      // DEBUG: Verifikasi penghapusan
      const verifyDelete = await client.query(
        'SELECT COUNT(*) as count FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
        [playlistId, songId]
      );
      console.log('Verify delete - remaining songs:', verifyDelete.rows[0].count);

      return deleteRes.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in deleteSong:', error);

      // PERBAIKAN: Handle error dengan lebih spesifik
      if (error instanceof NotFoundError) {
        console.error('NotFoundError in deleteSong:', error.message);
        throw error;
      }
      if (error instanceof AuthorizationError) {
        console.error('AuthorizationError in deleteSong:', error.message);
        throw error;
      }
      if (error instanceof ClientError) {
        console.error('ClientError in deleteSong:', error.message);
        throw error;
      }

      console.error('Unexpected error in deleteSong:', error);
      throw new ClientError(`Gagal menghapus lagu dari playlist: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Function to get the activities of a playlist
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
