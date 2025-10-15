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
    const { rowCount } = await pool.query('SELECT 1 FROM playlists WHERE id=$1 AND owner=$2', [
      playlistId,
      userId,
    ]);
    if (rowCount) return true;

    const collab = await pool.query(
      'SELECT 1 FROM collaborations WHERE playlist_id=$1 AND user_id=$2',
      [playlistId, userId]
    );
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

  async addSong(playlistId, songId, userId) {
    await this.verifyAccess(playlistId, userId);

    // Ubah query untuk memeriksa keberadaan songId dengan lebih jelas
    const songCheck = await pool.query('SELECT id FROM songs WHERE id = $1', [songId]);
    console.log('songCheck result:', songCheck); // Debug log untuk hasil query

    if (songCheck.rowCount === 0) {
      console.log(`Song not found: ${songId}`); // Debug log jika lagu tidak ditemukan
      throw new NotFoundError('Song not found');
    }

    const id = `ps-${nanoid(16)}`;
    console.log(`Inserting into playlist_songs with ID: ${id}`);
    await pool.query('INSERT INTO playlist_songs (id,playlist_id,song_id) VALUES ($1,$2,$3)', [
      id,
      playlistId,
      songId,
    ]);
    console.log('Inserted into playlist_songs successfully');

    console.log(`Inserting into playlist_activities with ID: act-${nanoid(16)}`);
    await pool.query(
      'INSERT INTO playlist_activities (id,playlist_id,song_id,user_id,action) VALUES ($1,$2,$3,$4,$5)',
      [`act-${nanoid(16)}`, playlistId, songId, userId, 'add']
    );
    console.log('Inserted into playlist_activities successfully');
  }

  async getSongs(playlistId, userId) {
    await this.verifyAccess(playlistId, userId);
    const q = `
      SELECT s.id, s.title, s.performer
      FROM playlist_songs ps
      JOIN songs s ON s.id=ps.song_id
      WHERE ps.playlist_id=$1
      ORDER BY s.title`;
    const { rows } = await pool.query(q, [playlistId]);
    return rows;
  }

  async deleteSong(playlistId, songId, userId) {
    await this.verifyAccess(playlistId, userId);
    const { rowCount } = await pool.query(
      'DELETE FROM playlist_songs WHERE playlist_id=$1 AND song_id=$2',
      [playlistId, songId]
    );
    if (!rowCount) throw new NotFoundError('Lagu tidak ada di playlist');
    await pool.query(
      'INSERT INTO playlist_activities (id,playlist_id,song_id,user_id,action) VALUES ($1,$2,$3,$4,$5)',
      [`act-${nanoid(16)}`, playlistId, songId, userId, 'delete']
    );
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
