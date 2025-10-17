const { nanoid } = require('nanoid');
const pool = require('../db/index');
const NotFoundError = require('../utils/error/NotFoundError');
const ClientError = require('../utils/error/ClientError');
const AuthorizationError = require('../utils/error/AuthorizationError');

class PlaylistsService {
  // Membuat playlist baru
  async create({ name, owner }) {
    if (!name || !owner) {
      throw new ClientError('Name and owner are required', 400);
    }

    const id = `playlist-${nanoid(16)}`;
    try {
      const result = await pool.query(
        'INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3)',
        [id, name, owner]
      );

      if (result.rowCount === 0) {
        throw new ClientError('Failed to create playlist', 400);
      }

      return id;
    } catch (error) {
      console.error('Database error:', error);
      throw new ClientError('Database error occurred while creating playlist', 500);
    }
  }

  // Mengambil playlist untuk user berdasarkan ID
  async getForUser(userId) {
    const q = `
      SELECT p.id, p.name, u.username AS username
      FROM playlists p
      JOIN users u ON u.id = p.owner
      WHERE p.owner=$1
      UNION
      SELECT p.id, p.name, u.username
      FROM collaborations c
      JOIN playlists p ON p.id=c.playlist_id
      JOIN users u ON u.id=p.owner
      WHERE c.user_id=$1
      ORDER BY name`;
    const { rows } = await pool.query(q, [userId]);
    return rows;
  }

  // Memverifikasi bahwa user adalah pemilik playlist
  async verifyOwner(playlistId, userId) {
    const { rows, rowCount } = await pool.query('SELECT owner FROM playlists WHERE id = $1', [
      playlistId,
    ]);
    if (rowCount === 0) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    if (rows[0].owner !== userId) {
      throw new AuthorizationError('Anda tidak berhak menghapus playlist ini');
    }
  }

  // Memverifikasi akses (apakah user adalah pemilik atau kolaborator)
  async verifyAccess(playlistId, userId) {
    console.log(`Verifying access for user ${userId} on playlist ${playlistId}`);

    const { rowCount } = await pool.query('SELECT 1 FROM playlists WHERE id=$1 AND owner=$2', [
      playlistId,
      userId,
    ]);
    console.log('Check if user is the owner:', rowCount);

    if (rowCount) return true;

    const collab = await pool.query(
      'SELECT 1 FROM collaborations WHERE playlist_id=$1 AND user_id=$2',
      [playlistId, userId]
    );
    console.log('Check if user is a collaborator:', collab.rowCount);

    if (collab.rowCount) return true;

    throw new ClientError('Anda tidak berhak mengakses resource ini', 403);
  }

  // Menghapus playlist
  async delete(playlistId, userId) {
    try {
      // Pastikan playlist ada dan user punya hak
      const { rows, rowCount } = await pool.query('SELECT owner FROM playlists WHERE id = $1', [
        playlistId,
      ]);

      if (rowCount === 0) {
        throw new NotFoundError('Playlist tidak ditemukan');
      }

      if (rows[0].owner !== userId) {
        throw new AuthorizationError('Anda tidak berhak menghapus playlist ini');
      }

      // 🟩 Hapus data turunan lebih dulu untuk hindari constraint FK
      await pool.query('DELETE FROM playlist_activities WHERE playlist_id = $1', [playlistId]);
      await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1', [playlistId]);

      // 🟩 Baru hapus playlist utamanya
      await pool.query('DELETE FROM playlists WHERE id = $1', [playlistId]);

      // Verifikasi sudah terhapus
      const { rowCount: verifyRowCount } = await pool.query(
        'SELECT id FROM playlists WHERE id = $1',
        [playlistId]
      );

      if (verifyRowCount > 0) {
        throw new ClientError('Gagal menghapus playlist dari database', 500);
      }

      return { status: 'success', message: 'Playlist berhasil dihapus' };
    } catch (err) {
      if (err instanceof ClientError) throw err;
      console.error('Error deleting playlist:', err);
      throw new ClientError('Database error occurred while deleting playlist', 500);
    }
  }

  // Menambahkan lagu ke playlist
  async addSong(playlistId, songId, userId) {
    try {
      await this.verifyAccess(playlistId, userId);

      const songCheck = await pool.query('SELECT id FROM songs WHERE id = $1', [songId]);
      if (songCheck.rowCount === 0) {
        throw new NotFoundError('Song not found');
      }

      const id = `ps-${nanoid(16)}`;
      await pool.query(
        'INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES ($1, $2, $3)',
        [id, playlistId, songId]
      );

      const activityId = `act-${nanoid(16)}`;
      await pool.query(
        'INSERT INTO playlist_activities (id, playlist_id, song_id, user_id, action) VALUES ($1, $2, $3, $4, $5)',
        [activityId, playlistId, songId, userId, 'add']
      );

      return id;
    } catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      console.error('Error adding song:', error);
      throw new ClientError('Database error occurred while adding song to playlist', 500);
    }
  }

  // Mengambil daftar lagu dalam playlist
  async getSongs(playlistId, userId) {
    try {
      // 🔹 Cek playlist dulu
      const metaQ = `
      SELECT p.id, p.name, u.username, p.owner
      FROM playlists p
      JOIN users u ON u.id = p.owner
      WHERE p.id = $1
    `;
      const metaRes = await pool.query(metaQ, [playlistId]);

      // Playlist tidak ditemukan → 404
      if (metaRes.rowCount === 0) {
        throw new NotFoundError('Playlist not found');
      }

      // 🔹 Verifikasi akses (owner atau kolaborator)
      await this.verifyAccess(playlistId, userId);

      // 🔹 Ambil lagu-lagu (bisa kosong)
      const songsQ = `
      SELECT s.id, s.title, s.performer
      FROM playlist_songs ps
      JOIN songs s ON s.id = ps.song_id
      WHERE ps.playlist_id = $1
      ORDER BY s.title
    `;
      const songsRes = await pool.query(songsQ, [playlistId]);

      // ✅ Return dalam format yang diharapkan test
      return {
        status: 'success',
        data: {
          playlist: {
            id: String(metaRes.rows[0].id),
            name: String(metaRes.rows[0].name),
            username: String(metaRes.rows[0].username),
            songs: songsRes.rows.map((s) => ({
              id: String(s.id),
              title: String(s.title),
              performer: String(s.performer),
            })),
          },
        },
      };
    } catch (error) {
      if (error instanceof ClientError) throw error;
      console.error('Error getSongs:', error);
      throw new ClientError('Database error occurred while fetching playlist songs', 500);
    }
  }

  // Menghapus lagu dari playlist
  async deleteSong(playlistId, songId, userId) {
    try {
      await this.verifyAccess(playlistId, userId);

      // Validasi songId
      if (!songId || songId.trim() === '') {
        throw new ClientError('songId is required', 400);
      }

      // Cek apakah lagu valid
      const songCheck = await pool.query('SELECT id FROM songs WHERE id = $1', [songId]);
      if (songCheck.rowCount === 0) {
        throw new ClientError('Song not found', 400);
      }

      // Hapus lagu dari playlist (idempoten)
      await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2', [
        playlistId,
        songId,
      ]);

      // Catat aktivitas delete
      await pool.query(
        'INSERT INTO playlist_activities (id, playlist_id, song_id, user_id, action, time) VALUES ($1, $2, $3, $4, $5, NOW())',
        [`act-${nanoid(16)}`, playlistId, songId, userId, 'delete']
      );

      return { status: 'success', message: 'Lagu berhasil dihapus dari playlist' };
    } catch (err) {
      if (err instanceof ClientError) throw err;
      console.error('Error deleteSong:', err);
      throw new ClientError('Database error occurred while deleting song from playlist', 500);
    }
  }

  async getActivities(playlistId, userId) {
    try {
      const playlistCheck = await pool.query('SELECT id, owner FROM playlists WHERE id = $1', [
        playlistId,
      ]);

      if (playlistCheck.rowCount === 0) {
        throw new NotFoundError('Playlist tidak ditemukan');
      }

      await this.verifyAccess(playlistId, userId);

      const q = `
      SELECT 
        u.username, 
        s.title, 
        pa.action, 
        pa.time
      FROM playlist_activities pa
      JOIN users u ON u.id = pa.user_id
      JOIN songs s ON s.id = pa.song_id
      WHERE pa.playlist_id = $1
      ORDER BY pa.time ASC
    `;
      const { rows } = await pool.query(q, [playlistId]);

      return {
        playlistId,
        activities: rows.map((r) => ({
          username: r.username,
          title: r.title,
          action: r.action,
          time: r.time,
        })),
      };
    } catch (error) {
      if (error instanceof ClientError) throw error;
      console.error('Error getActivities:', error);
      throw new ClientError('Database error occurred while fetching playlist activities', 500);
    }
  }
}

module.exports = PlaylistsService;
