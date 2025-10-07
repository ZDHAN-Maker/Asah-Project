const InvariantError = require('../../utils/error/InvariantError');
const NotFoundError = require('../../utils/error/NotFoundError');

class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
  }

  async postAlbumHandler(req, res) {
    try {
      this._validator(req.body);
      const albumId = await this._service.addAlbum(req.body);
      return res.status(201).json({
        status: 'success',
        data: { albumId },
      });
    } catch (error) {
      console.error('❌ Error detail:', error);

      if (error instanceof InvariantError) {
        return res.status(400).json({
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

  async getAlbumByIdHandler(req, res) {
    try {
      const { id } = req.params;
      const album = await this._service.getAlbumById(id);
      return res.json({
        status: 'success',
        data: { album },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
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

module.exports = AlbumsHandler;
