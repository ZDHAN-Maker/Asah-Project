const db = require('../db/index');
const ClientError = require('../utils/error/ClientError');

class CollaborationsService {
  constructor(playlistService) {
    this._playlistService = playlistService;
  }

  async addCollaborator(playlistId, userId, requesterId) {
    // 🔹 Verifikasi bahwa yang menambahkan adalah owner playlist
    await this._playlistService.verifyPlaylistOwner(playlistId, requesterId);

    // 🔹 Pastikan user ada
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);
    if (userResult.rows.length === 0) {
      throw new ClientError('User not found', 404);
    }

    // 🔹 Cek apakah sudah ada kolaborator
    const checkQuery = `
      SELECT * FROM collaborations 
      WHERE playlist_id = $1 AND user_id = $2
    `;
    const checkResult = await db.query(checkQuery, [playlistId, userId]);
    if (checkResult.rows.length > 0) {
      throw new ClientError('User is already a collaborator', 400);
    }

    // 🔹 Tambahkan kolaborator baru
    const collaborationId = `collab_${Math.random().toString(36).substr(2, 9)}`;
    const insertQuery = `
      INSERT INTO collaborations (id, playlist_id, user_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const insertResult = await db.query(insertQuery, [collaborationId, playlistId, userId]);

    return insertResult.rows[0].id;
  }

  async removeCollaborator(playlistId, userId, requesterId) {
    // 🔹 Verifikasi bahwa yang menghapus adalah owner playlist
    await this._playlistService.verifyPlaylistOwner(playlistId, requesterId);

    const deleteQuery = `
      DELETE FROM collaborations 
      WHERE playlist_id = $1 AND user_id = $2
      RETURNING id
    `;
    const result = await db.query(deleteQuery, [playlistId, userId]);
    if (result.rowCount === 0) {
      throw new ClientError('Kolaborator tidak ditemukan pada playlist ini', 404);
    }
  }
}

module.exports = CollaborationsService;
