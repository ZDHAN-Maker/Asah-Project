const InvariantError = require('../../utils/error/InvariantError');

class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    try {
      this._validator(request.payload);
      const albumId = await this._service.addAlbum(request.payload);
      return h.response({ status: 'success', data: { albumId } }).code(201);
    } catch (error) {
      if (error.name === 'ValidationError' || error instanceof InvariantError) {
        return h.response({ status: 'fail', message: error.message }).code(400);
      }
      // server error
      return h.response({ status: 'error', message: 'Terjadi kesalahan pada server' }).code(500);
    }
  }

  async getAlbumByIdHandler(request, h) {
    try {
      const { id } = request.params;
      const album = await this._service.getAlbumById(id);
      return { status: 'success', data: { album } };
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return h.response({ status: 'fail', message: error.message }).code(404);
      }
      return h.response({ status: 'error', message: 'Terjadi kesalahan pada server' }).code(500);
    }
  }

  // ... put & delete handlers similar handling errors
}

module.exports = AlbumsHandler;
