const ClientError = require('../../utils/error/ClientError');

class AlbumsHandler {
  constructor(service, validator, songsService) {
    this._service = service;
    this._validator = validator;
    this._songsService = songsService;
    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
  }

  // POST /albums
  async postAlbumHandler(req, res) {
    try {
      this._validator(req.body);
      const albumId = await this._service.addAlbum(req.body);
      return res.status(201).json({
        status: 'success',
        data: { albumId },
      });
    } catch (error) {
      console.error('postAlbumHandler error:', error);
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

  // GET /albums/{id}
  async getAlbumByIdHandler(req, res) {
    try {
      const { id } = req.params;

      const album = await this._service.getAlbumById(id);
      if (!album) {
        throw new ClientError('Album tidak ditemukan', 404);
      }

      const songs = await this._songsService.getSongsByAlbumId(id);

      return res.status(200).json({
        status: 'success',
        data: {
          album: {
            id: album.id,
            name: album.name,
            year: album.year,
            songs,
          },
        },
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: 'fail',
          message: error.message,
        });
      }

      console.error('getAlbumByIdHandler error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }

  async putAlbumByIdHandler(req, res) {
    try {
      this._validator(req.body);
      const { id } = req.params;
      await this._service.editAlbumById(id, req.body);
      return res.json({
        status: 'success',
        message: 'Album berhasil diperbarui',
      });
    } catch (error) {
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

  async deleteAlbumByIdHandler(req, res) {
    try {
      const { id } = req.params;
      await this._service.deleteAlbumById(id);
      return res.json({
        status: 'success',
        message: 'Album berhasil dihapus',
      });
    } catch (error) {
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

module.exports = AlbumsHandler;
