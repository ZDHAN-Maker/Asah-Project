const ClientError = require('../../utils/error/ClientError');

class CollaboratorHandler {
  constructor(collaborationsService, validator) {
    this._collaborationsService = collaborationsService;
    this._validator = validator;

    this.postCollaboratorHandler = this.postCollaboratorHandler.bind(this);
    this.deleteCollaboratorHandler = this.deleteCollaboratorHandler.bind(this);
  }
  
  // Method untuk menambahkan kolaborator
  async postCollaboratorHandler(req, res) {
    try {
      const requesterId = req.auth.userId;
      const { playlistId, userId } = req.body;

      const collaborationId = await this._collaborationsService.addCollaborator(
        playlistId,
        userId,
        requesterId
      );

      res.status(201).json({
        status: 'success',
        message: 'Kolaborator berhasil ditambahkan',
        data: { collaborationId },
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        status: 'fail',
        message: error.message,
      });
    }
  }
  // Method untuk menghapus kolaborator
  async deleteCollaboratorHandler(req, res) {
    try {
      this._validator(req.body);

      const { playlistId, userId } = req.body;

      const requesterId = req.auth.userId; // Sesuaikan dengan autentikasi yang digunakan

      if (!requesterId) {
        return res.status(401).json({
          status: 'fail',
          message: 'User belum terautentikasi',
        });
      }

      await this._collaborationsService.removeCollaborator(playlistId, userId, requesterId);

      return res.status(200).json({
        status: 'success',
        message: 'Kolaborator berhasil dihapus',
      });
    } catch (error) {
      console.error('deleteCollaboratorHandler error:', error);

      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: 'fail',
          message: error.message,
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }
}

module.exports = CollaboratorHandler;
