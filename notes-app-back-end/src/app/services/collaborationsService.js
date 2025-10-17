const db = require('../db/index');
const ClientError = require('../utils/error/ClientError');

class CollaborationsService {
  async addCollaborator(playlistId, userId) {
    // Pastikan playlist ada
    const playlistQuery = 'SELECT * FROM playlists WHERE id = $1';
    const playlistResult = await db.query(playlistQuery, [playlistId]);
    if (playlistResult.rows.length === 0) {
      throw new ClientError('Playlist not found', 404);
    }

    // Pastikan user ada
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);
    if (userResult.rows.length === 0) {
      throw new ClientError('User not found', 404);
    }

    // Cek apakah kolaborator sudah ada
    const checkQuery = `
      SELECT * FROM collaborations 
      WHERE playlist_id = $1 AND user_id = $2
    `;
    const checkResult = await db.query(checkQuery, [playlistId, userId]);
    if (checkResult.rows.length > 0) {
      throw new ClientError('User is already a collaborator', 400); // Mengembalikan 400, bukan 403
    }

    // Insert kolaborator baru
    const collaborationId = `collab_${Math.random().toString(36).substr(2, 9)}`;
    const insertQuery = `
      INSERT INTO collaborations (id, playlist_id, user_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const insertResult = await db.query(insertQuery, [collaborationId, playlistId, userId]);

    return insertResult.rows[0].id;
  }

  async removeCollaborator(playlistId, userId) {
    try {
      // Pastikan playlist ada
      const playlistQuery = 'SELECT * FROM playlists WHERE id = $1';
      const playlistResult = await db.query(playlistQuery, [playlistId]);
      if (playlistResult.rows.length === 0) {
        throw new ClientError('Playlist not found', 404);
      }

      // Pastikan user ada
      const userQuery = 'SELECT * FROM users WHERE id = $1';
      const userResult = await db.query(userQuery, [userId]);
      if (userResult.rows.length === 0) {
        throw new ClientError('User not found', 404);
      }

      // Cek apakah kolaborator ada
      const checkQuery = `
      SELECT * FROM collaborations 
      WHERE playlist_id = $1 AND user_id = $2
    `;
      const checkResult = await db.query(checkQuery, [playlistId, userId]);
      if (checkResult.rows.length === 0) {
        throw new ClientError('User is not a collaborator', 400); // Mengembalikan 400, bukan 403
      }

      // Hapus kolaborator
      const deleteQuery = `
      DELETE FROM collaborations 
      WHERE playlist_id = $1 AND user_id = $2
    `;
      const deleteResult = await db.query(deleteQuery, [playlistId, userId]);

      // Tangani jika tidak ada baris yang dihapus (misalnya jika kolaborator sudah dihapus sebelumnya)
      if (deleteResult.rowCount === 0) {
        throw new ClientError('Failed to delete collaborator', 500); // Perbarui penanganan kesalahan untuk kegagalan
      }

      return true;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      if (error instanceof ClientError) {
        throw error; // Lempar ulang kesalahan khusus untuk ditangani oleh controller
      }

      // Kembalikan kesalahan server umum untuk kesalahan yang tidak ditangani
      throw new ClientError('Database error occurred while deleting playlist', 500); // Pastikan ini jelas
    }
  }
}

module.exports = CollaborationsService;
