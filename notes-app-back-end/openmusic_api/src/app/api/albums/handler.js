const fs = require('fs');
const multer = require('multer');
const ClientError = require('../../utils/error/ClientError');
const NotFoundError = require('../../utils/error/NotFoundError');
const validateAlbum = require('./validator');

class AlbumsHandler {
  constructor(service, songsService, likesService) {
    this._service = service;
    this._songsService = songsService;
    this._likesService = likesService;

    // Bind methods
    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postUploadCover = this.postUploadCover.bind(this);
    this.postLikeAlbum = this.postLikeAlbum.bind(this);
    this.deleteLikeAlbum = this.deleteLikeAlbum.bind(this);
    this.getAlbumLikes = this.getAlbumLikes.bind(this);
  }

  async _handleError(res, error, defaultMessage) {
    if (error instanceof ClientError) {
      return res.status(error.statusCode).json({
        status: 'fail',
        message: error.message,
      });
    }

    console.error('Server Error:', error);
    return res.status(500).json({
      status: 'error',
      message: defaultMessage,
    });
  }

  async _validateAlbumExists(id) {
    const album = await this._service.getAlbumById(id);
    if (!album) throw new NotFoundError('Album tidak ditemukan');
    return album;
  }

  // === POST /albums ===
  async postAlbumHandler(req, res) {
    try {
      const { name, year } = req.body;
      const albumId = await this._service.addAlbum({ name, year });

      return res.status(201).json({
        status: 'success',
        message: 'Album berhasil ditambahkan',
        data: { albumId },
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  // === GET /albums/{id} ===
  async getAlbumByIdHandler(req, res) {
    try {
      const { id } = req.params;
      const album = await this._service.getAlbumDetailById(id);

      return res.status(200).json({
        status: 'success',
        data: { album },
      });
    } catch (error) {
      if (error.message.includes('tidak ditemukan')) {
        return res.status(404).json({
          status: 'fail',
          message: 'Album tidak ditemukan',
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan internal server',
      });
    }
  }

  // === PUT /albums/{id} ===
  async putAlbumByIdHandler(req, res) {
    try {
      const { id } = req.params;
      const { name, year } = req.body;

      validateAlbum(req.body);
      await this._validateAlbumExists(id);
      await this._service.editAlbumById(id, { name, year });

      return res.status(200).json({
        status: 'success',
        message: 'Album berhasil diperbarui',
      });
    } catch (error) {
      return this._handleError(res, error, 'Terjadi kesalahan server saat memperbarui album');
    }
  }

  // === DELETE /albums/{id} ===
  async deleteAlbumByIdHandler(req, res) {
    try {
      const { id } = req.params;
      await this._validateAlbumExists(id);
      await this._service.deleteAlbumById(id);

      return res.status(200).json({
        status: 'success',
        message: 'Album berhasil dihapus',
      });
    } catch (error) {
      return this._handleError(res, error, 'Terjadi kesalahan server saat menghapus album');
    }
  }

  // === POST /albums/{id}/covers ===
  async postUploadCover(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'fail',
          message: 'File cover belum diunggah',
        });
      }

      const { id: albumId } = req.params;
      const relativePath = `uploads/covers/${req.file.filename}`;

      const updated = await this._service.updateAlbumCover(albumId, relativePath);
      if (!updated) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          status: 'fail',
          message: 'Album tidak ditemukan',
        });
      }

      const host = process.env.HOST || 'localhost';
      const port = process.env.PORT || 5000;
      const fullUrl = `http://${host}:${port}/${relativePath}`;

      return res.status(201).json({
        status: 'success',
        message: 'Cover album berhasil diunggah',
        data: { albumId, coverUrl: fullUrl },
      });
    } catch (error) {
      console.error('Upload Error:', error);

      if (error instanceof multer.MulterError) {
        return res.status(400).json({
          status: 'fail',
          message: error.message,
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan internal server',
      });
    }
  }

  // === POST /albums/{id}/likes ===
  async postLikeAlbum(req, res) {
    try {
      const { id: albumId } = req.params;
      const userId = req.auth?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Missing authentication',
        });
      }

      await this._validateAlbumExists(albumId);

      const alreadyLiked = await this._likesService.checkUserLike(albumId, userId);
      if (alreadyLiked) {
        return res.status(400).json({
          status: 'fail',
          message: 'User already liked this album',
        });
      }

      await this._likesService.likeAlbum(albumId, userId);
      return res.status(201).json({
        status: 'success',
        message: 'Album liked successfully',
      });
    } catch (error) {
      return this._handleError(res, error, 'Server error while liking album');
    }
  }

  // === DELETE /albums/{id}/likes ===
  async deleteLikeAlbum(req, res) {
    try {
      const { id: albumId } = req.params;
      const userId = req.auth?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Missing authentication',
        });
      }

      await this._validateAlbumExists(albumId);

      const alreadyLiked = await this._likesService.checkUserLike(albumId, userId);
      if (!alreadyLiked) {
        return res.status(400).json({
          status: 'fail',
          message: 'User has not liked this album',
        });
      }

      await this._likesService.unlikeAlbum(albumId, userId);
      return res.status(200).json({
        status: 'success',
        message: 'Album unliked successfully',
      });
    } catch (error) {
      return this._handleError(res, error, 'Server error while unliking album');
    }
  }

  // === GET /albums/{id}/likes ===
  async getAlbumLikes(req, res) {
    try {
      const { id: albumId } = req.params;
      await this._validateAlbumExists(albumId);

      const result = await this._likesService.getLikesCount(albumId);
      const response = res.status(200);
      if (result.fromCache) response.set('X-Data-Source', 'cache');

      return response.json({
        status: 'success',
        data: { likes: result.count },
      });
    } catch (error) {
      return this._handleError(res, error, 'Server error while getting like count');
    }
  }
}

module.exports = AlbumsHandler;
