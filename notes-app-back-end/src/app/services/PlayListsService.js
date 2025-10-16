const { nanoid } = require('nanoid');
const pool = require('../db/index');
const NotFoundError = require('../utils/error/NotFoundError');
const ClientError = require('../utils/error/ClientError');

class PlaylistsService {
  async create({ name, owner }) {
    if (!name || !owner) {
      throw new ClientError(400, 'Name and owner are required'); // Pastikan validasi nama dan owner
    }

    const id = `playlist-${nanoid(16)}`;
    try {
      const result = await pool.query(
        'INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3)',
        [id, name, owner]
      );

      // Perbaiki status code yang digunakan untuk error saat query gagal
      if (result.rowCount === 0) {
        throw new ClientError(400, 'Failed to create playlist');
      }

      return id; // Kembalikan id playlist yang baru dibuat
    } catch (error) {
      console.error('Database error:', error); // Debugging log
      throw new ClientError(500, 'Database error occurred while creating playlist');
    }
  }

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

  async verifyAccess(playlistId, userId) {
    console.log(`Verifying access for user ${userId} on playlist ${playlistId}`);

    const { rowCount } = await pool.query('SELECT 1 FROM playlists WHERE id=$1 AND owner=$2', [
      playlistId,
      userId,
    ]);
    console.log('Check if user is the owner:', rowCount); // Log hasil pengecekan owner

    if (rowCount) return true;

    const collab = await pool.query(
      'SELECT 1 FROM collaborations WHERE playlist_id=$1 AND user_id=$2',
      [playlistId, userId]
    );
    console.log('Check if user is a collaborator:', collab.rowCount); // Log hasil pengecekan kolaborator

    if (collab.rowCount) return true;

    throw new ClientError('Anda tidak berhak mengakses resource ini', 403);
  }

  async delete(playlistId, userId) {
    const { rowCount } = await pool.query('DELETE FROM playlists WHERE id=$1 AND owner=$2', [
      playlistId,
      userId,
    ]);
    if (!rowCount) throw new NotFoundError('Playlist tidak ditemukan');
  }

  async verifyOwner(playlistId, userId) {
    const { rows, rowCount } = await pool.query('SELECT owner FROM playlists WHERE id = $1', [
      playlistId,
    ]);
    if (rowCount === 0) {
      throw new NotFoundError('Playlist tidak ditemukan'); // 404 kalau memang tidak ada
    }
    if (rows[0].owner !== userId) {
      throw new AuthorizationError('Anda tidak berhak menghapus playlist ini'); // 403 kalau ada tapi bukan milik user
    }
  }
  async addSong(playlistId, songId, userId) {
    try {
      // 403 kalau user tidak punya akses
      await this.verifyAccess(playlistId, userId);

      // 404 kalau lagu tidak ada
      const songCheck = await pool.query('SELECT id FROM songs WHERE id = $1', [songId]);
      if (songCheck.rowCount === 0) {
        throw new NotFoundError('Song not found'); // NotFoundError harus extends ClientError (statusCode 404)
      }

      // Insert ke playlist_songs
      const id = `ps-${nanoid(16)}`;
      await pool.query(
        'INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES ($1, $2, $3)',
        [id, playlistId, songId]
      );

      // Catat aktivitas
      const activityId = `act-${nanoid(16)}`;
      await pool.query(
        'INSERT INTO playlist_activities (id, playlist_id, song_id, user_id, action) VALUES ($1, $2, $3, $4, $5)',
        [activityId, playlistId, songId, userId, 'add']
      );

      return id; // opsional, tapi bagus untuk konfirmasi
    } catch (error) {
      if (error instanceof ClientError) {
        throw error; // biarkan 400/403/404 tetap 400/403/404
      }
      console.error('Error adding song:', error);
      throw new ClientError('Database error occurred while adding song to playlist', 500);
    }
  }

  async getSongs(playlistId, userId) {
    try {
      await this.verifyAccess(playlistId, userId); // akan lempar 403 kalau tak berhak

      // metadata playlist + owner username
      const metaQ = `
      SELECT p.id, p.name, u.username
      FROM playlists p
      JOIN users u ON u.id = p.owner
      WHERE p.id = $1
    `;
      const metaRes = await pool.query(metaQ, [playlistId]);
      if (metaRes.rowCount === 0) {
        throw new NotFoundError('Playlist not found');
      }

      // daftar lagu
      const songsQ = `
  SELECT s.id, s.title, s.performer
  FROM playlist_songs ps
  JOIN songs s ON s.id = ps.song_id
  WHERE ps.playlist_id = $1
  GROUP BY s.id, s.title, s.performer
  ORDER BY s.title
`;
      const songsRes = await pool.query(songsQ, [playlistId]);

      // kembalikan shape yang diharapkan tester
      return {
        id: metaRes.rows[0].id,
        name: metaRes.rows[0].name,
        username: metaRes.rows[0].username,
        songs: songsRes.rows,
      };
    } catch (error) {
      if (error instanceof ClientError) throw error;
      console.error('Error getSongs:', error);
      throw new ClientError('Database error occurred while fetching playlist songs', 500);
    }
  }

  async deleteSong(playlistId, songId, userId) {
    try {
      await this.verifyAccess(playlistId, userId);

      const delRes = await pool.query(
        `DELETE FROM playlist_songs
       WHERE playlist_id = $1 AND song_id = $2
       RETURNING id`,
        [playlistId, songId]
      );

      if (delRes.rowCount === 0) {
        return;
      }

      await pool.query(
        'INSERT INTO playlist_activities (id, playlist_id, song_id, user_id, action) VALUES ($1, $2, $3, $4, $5)',
        [`act-${nanoid(16)}`, playlistId, songId, userId, 'delete']
      );
    } catch (err) {
      if (err instanceof ClientError) throw err;
      console.error('Error deleteSong:', err);
      throw new ClientError('Database error occurred while deleting song from playlist', 500);
    }
  }

  async getActivities(playlistId, userId) {
    await this.verifyAccess(playlistId, userId);
    const q = `
      SELECT u.username, a.action, a.time, a.song_id
      FROM playlist_activities a
      JOIN users u ON u.id=a.user_id
      WHERE a.playlist_id=$1
      ORDER BY a.time`;
    const { rows } = await pool.query(q, [playlistId]);
    return rows;
  }
}

module.exports = PlaylistsService;
