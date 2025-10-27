const ClientError = require('../../utils/error/ClientError');
const NotFoundError = require('../../utils/error/NotFoundError');

class CollaboratorHandler {
  constructor(collaborationsService, validator) {
    this._collaborationsService = collaborationsService;
    this._validator = validator;

    this.postCollaboratorHandler = this.postCollaboratorHandler.bind(this);
    this.deleteCollaboratorHandler = this.deleteCollaboratorHandler.bind(this);
  }

  // Tambah kolaborator
  async postCollaboratorHandler(req, res) {
    try {
      const requesterId = req.auth.userId;
      const { playlistId, userId } = req.body;

      this._validator(req.body);

      const collaborationId = await this._collaborationsService.addCollaborator(
        playlistId,
        userId,
        requesterId
      );

      return res.status(201).json({
        status: 'success',
        data: { collaborationId },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: error.message });
      }

      if (error instanceof ClientError) {
        return res.status(error.statusCode || 400).json({
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

  // Hapus kolaborator
  async deleteCollaboratorHandler(req, res) {
    try {
      this._validator(req.body);
      const { playlistId, userId } = req.body;
      const requesterId = req.auth.userId;

      await this._collaborationsService.removeCollaborator(playlistId, userId, requesterId);

      return res.status(200).json({
        status: 'success',
        message: 'Kolaborator berhasil dihapus',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: error.message });
      }

      if (error instanceof ClientError) {
        return res.status(error.statusCode || 400).json({
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
