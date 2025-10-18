const { nanoid } = require('nanoid');
const pool = require('../db/index');
const ClientError = require('../utils/error/ClientError');
const NotFoundError = require('../utils/error/NotFoundError');

class CollaborationsService {
  constructor(playlistService) {
    this._playlistService = playlistService;
  }

  async addCollaborator(playlistId, userId, requesterId) {
    // Pastikan requester adalah owner playlist
    await this._playlistService.verifyPlaylistOwner(playlistId, requesterId);

    // Pastikan user yang akan ditambahkan ada
    const userRes = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) {
      throw new NotFoundError('User tidak ditemukan');
    }

    // Pastikan belum ada kolaborator yang sama
    const existRes = await pool.query(
      'SELECT 1 FROM collaborations WHERE playlist_id = $1 AND user_id = $2',
      [playlistId, userId]
    );
    if (existRes.rowCount > 0) {
      throw new ClientError('User sudah menjadi kolaborator di playlist ini', 400);
    }

    // Tambahkan kolaborator baru
    const id = `collab-${nanoid(16)}`;
    const insertRes = await pool.query(
      'INSERT INTO collaborations (id, playlist_id, user_id) VALUES ($1, $2, $3) RETURNING id',
      [id, playlistId, userId]
    );

    if (insertRes.rowCount === 0) {
      throw new ClientError('Gagal menambahkan kolaborator', 400);
    }

    return insertRes.rows[0].id;
  }

  async removeCollaborator(playlistId, userId, requesterId) {
    // Pastikan requester adalah owner playlist
    await this._playlistService.verifyPlaylistOwner(playlistId, requesterId);

    const deleteRes = await pool.query(
      'DELETE FROM collaborations WHERE playlist_id = $1 AND user_id = $2 RETURNING id',
      [playlistId, userId]
    );

    if (deleteRes.rowCount === 0) {
      throw new NotFoundError('Kolaborator tidak ditemukan pada playlist ini');
    }

    return true;
  }
}

module.exports = CollaborationsService;
