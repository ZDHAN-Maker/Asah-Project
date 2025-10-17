const { nanoid } = require('nanoid');
const pool = require('../db/index');
const NotFoundError = require('../utils/error/NotFoundError');
const ClientError = require('../utils/error/ClientError');
const AuthorizationError = require('../utils/error/AuthorizationError');
class PlaylistsService {
  async create({ name, owner }) {
    if (!name || !owner) {
      throw new ClientError('Name and owner are required', 400);
    }

    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3)',
      values: [id, name, owner],
    };

    try {
      const result = await pool.query(query);
      if (result.rowCount === 0) {
        throw new ClientError('Gagal membuat playlist', 400);
      }
      return id;
    } catch (error) {
      console.error('Database error (create):', error);
      throw new ClientError('Terjadi kesalahan pada database', 500);
    }
  }

  async getForUser(userId) {
    const q = `
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
    const { rows } = await pool.query(q, [userId]);
    return rows;
  }

  async verifyOwner(playlistId, userId) {
    const { rows, rowCount } = await pool.query('SELECT owner FROM playlists WHERE id = $1', [
      playlistId,
    ]);

    if (rowCount === 0) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    if (rows[0].owner !== userId) {
      throw new AuthorizationError('Anda tidak berhak mengakses playlist ini');
    }
  }

  async verifyPlaylistOwner(playlistId, userId) {
    const result = await pool.query('SELECT owner FROM playlists WHERE id = $1', [playlistId]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];
    if (playlist.owner !== userId) {
      throw new AuthorizationError('Anda tidak berhak mengakses playlist ini');
    }
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
    await this.verifyOwner(playlistId, userId);

    try {
      await pool.query('DELETE FROM playlist_activities WHERE playlist_id = $1', [playlistId]);
      await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1', [playlistId]);
      await pool.query('DELETE FROM playlists WHERE id = $1', [playlistId]);

      return { status: 'success', message: 'Playlist berhasil dihapus' };
    } catch (err) {
      console.error('Error deleting playlist:', err);
      throw new ClientError('Database error occurred while deleting playlist', 500);
    }
  }

  async addSong(playlistId, songId, userId) {
    await this.verifyAccess(playlistId, userId);

    const songCheck = await pool.query('SELECT id FROM songs WHERE id = $1', [songId]);
    if (songCheck.rowCount === 0) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    const id = `ps-${nanoid(16)}`;
    await pool.query('INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES ($1, $2, $3)', [
      id,
      playlistId,
      songId,
    ]);

    const activityId = `act-${nanoid(16)}`;
    await pool.query(
      'INSERT INTO playlist_activities (id, playlist_id, song_id, user_id, action, time) VALUES ($1, $2, $3, $4, $5, NOW())',
      [activityId, playlistId, songId, userId, 'add']
    );

    return id;
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
  }

  async deleteSong(playlistId, songId, userId) {
    await this.verifyAccess(playlistId, userId);

    const songCheck = await pool.query('SELECT id FROM songs WHERE id = $1', [songId]);
    if (songCheck.rowCount === 0) throw new NotFoundError('Lagu tidak ditemukan');

    await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2', [
      playlistId,
      songId,
    ]);

    const actId = `act-${nanoid(16)}`;
    await pool.query(
      'INSERT INTO playlist_activities (id, playlist_id, song_id, user_id, action, time) VALUES ($1, $2, $3, $4, $5, NOW())',
      [actId, playlistId, songId, userId, 'delete']
    );

    return { status: 'success', message: 'Lagu berhasil dihapus dari playlist' };
  }

  async getActivities(playlistId, userId) {
    const playlistCheck = await pool.query('SELECT id FROM playlists WHERE id = $1', [playlistId]);
    if (playlistCheck.rowCount === 0) throw new NotFoundError('Playlist tidak ditemukan');

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

    return {
      playlistId,
      activities: rows.map((r) => ({
        username: r.username,
        title: r.title,
        action: r.action,
        time: r.time,
      })),
    };
  }
}

module.exports = PlaylistsService;
