const ClientError = require('../../utils/error/ClientError');

class CollaboratorHandler {
  constructor(collaborationsService, validator) {
    this._collaborationsService = collaborationsService;
    this._validator = validator;

    this.postCollaboratorHandler = this.postCollaboratorHandler.bind(this);
    this.deleteCollaboratorHandler = this.deleteCollaboratorHandler.bind(this);
  }

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

  async deleteCollaboratorHandler(req, res) {
    try {
      // Validasi input body jika diperlukan
      this._validator(req.body);

      // Mendapatkan data dari request body
      const { playlistId, userId } = req.body;

      // Mendapatkan requesterId dari req.auth atau req.user
      const requesterId = req.auth.userId; // Sesuaikan dengan autentikasi yang digunakan

      // Pastikan requesterId valid
      if (!requesterId) {
        return res.status(401).json({
          status: 'fail',
          message: 'User belum terautentikasi',
        });
      }

      // Panggil service untuk menghapus kolaborator
      await this._collaborationsService.removeCollaborator(playlistId, userId, requesterId);

      // Kirim respons sukses jika kolaborator berhasil dihapus
      return res.status(200).json({
        status: 'success',
        message: 'Kolaborator berhasil dihapus',
      });
    } catch (error) {
      // Tangani error yang muncul
      console.error('deleteCollaboratorHandler error:', error);

      // Jika error berupa ClientError, kirimkan status dan pesan sesuai error
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: 'fail',
          message: error.message,
        });
      }

      // Jika error lain, kirimkan status 500
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }
}

module.exports = CollaboratorHandler;
