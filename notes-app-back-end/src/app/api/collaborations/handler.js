const ClientError = require('../../utils/error/ClientError');

class CollaboratorHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    this.postCollaboratorHandler = this.postCollaboratorHandler.bind(this);
    this.deleteCollaboratorHandler = this.deleteCollaboratorHandler.bind(this);
  }

  async postCollaboratorHandler(req, res) {
    try {
      this._validator(req.body);

      const { playlistId, userId } = req.body;
      const collaborationId = await this._service.addCollaborator(playlistId, userId);

      return res.status(201).json({
        status: 'success',
        data: { collaborationId },
      });
    } catch (error) {
      console.error('postCollaboratorHandler error:', error);
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

  // DELETE /collaborations
  async deleteCollaboratorHandler(req, res) {
    try {
      // Validate request body
      this._validator(req.body);

      // Call service to remove collaborator
      const { playlistId, userId } = req.body;
      await this._service.removeCollaborator(playlistId, userId);

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
