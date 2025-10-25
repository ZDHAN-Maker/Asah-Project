// src/services/PlayListsService.js
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
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
  }

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

        // Hapus aktivitas (sesuaikan nama tabel dengan DB: playlist_song_activities)
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
