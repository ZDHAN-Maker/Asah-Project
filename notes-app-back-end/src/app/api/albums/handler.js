const path = require('path');
const multer = require('multer');
const ClientError = require('../../utils/error/ClientError');
const NotFoundError = require('../../utils/error/NotFoundError');
const validateAlbum = require('./validator');

class AlbumsHandler {
  constructor(service, validator, songsService, likesService) {
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

  // === POST /albums ===
  async postAlbumHandler(req, res) {
    try {
      const { body } = req;
      validateAlbum(body);

      const albumId = await this._service.addAlbum(body);
      return res.status(201).json({
        status: 'success',
        data: { albumId },
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

  // === GET /albums/{id} ===
  async getAlbumByIdHandler(req, res) {
    try {
      const { id } = req.params;
      const album = await this._service.getAlbumById(id);

      if (!album) {
        return res.status(404).json({
          status: 'fail',
          message: 'Album tidak ditemukan',
        });
      }

      const { name, year, coverUrl, songs } = album;
      return res.status(200).json({
        status: 'success',
        data: { album: { id, name, year, coverUrl, songs } },
      });
    } catch {
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }

  // === PUT /albums/{id} ===
  async putAlbumByIdHandler(req, res) {
    try {
      const { id } = req.params;
      const { name, year } = req.body;

      validateAlbum(req.body);

      const albumExists = await this._service.getAlbumById(id);
      if (!albumExists) {
        return res.status(404).json({
          status: 'fail',
          message: 'Album tidak ditemukan',
        });
      }

      await this._service.editAlbumById(id, { name, year });
      return res.status(200).json({
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
        message: 'Terjadi kesalahan server saat memperbarui album',
      });
    }
  }

  // === DELETE /albums/{id} ===
  async deleteAlbumByIdHandler(req, res) {
    try {
      const { id } = req.params;
      const albumExists = await this._service.getAlbumById(id);

      if (!albumExists) throw new NotFoundError('Album tidak ditemukan untuk dihapus');

      await this._service.deleteAlbumById(id);
      return res.status(200).json({
        status: 'success',
        message: 'Album berhasil dihapus',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json({
          status: 'fail',
          message: error.message,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server saat menghapus album',
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

      await this._likesService.likeAlbum(albumId, userId);
      return res.status(201).json({
        status: 'success',
        message: 'Album disukai',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: error.message });
      }
      if (error.message.includes('sudah menyukai')) {
        return res.status(400).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
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

      await this._likesService.unlikeAlbum(albumId, userId);
      return res.status(200).json({
        status: 'success',
        message: 'Batal menyukai album',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }

  // === GET /albums/{id}/likes ===
  async getAlbumLikes(req, res) {
    try {
      const { id: albumId } = req.params;
      const result = await this._likesService.getLikesCount(albumId);
      const headers = result.fromCache ? { 'X-Data-Source': 'cache' } : {};

      return res
        .status(200)
        .set(headers)
        .json({
          status: 'success',
          data: { likes: result.count },
        });
    } catch {
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }

  // === POST /albums/{id}/covers ===
  async postUploadCover(req, res) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          status: 'fail',
          message: 'File cover belum diunggah',
        });
      }

      const filePath = path.join('uploads', req.file.filename);
      await this._service.updateAlbumCover(id, filePath);

      return res.status(201).json({
        status: 'success',
        message: 'Sampul album berhasil diunggah',
      });
    } catch (error) {
      if (error instanceof multer.MulterError) {
        const message = error.code === 'LIMIT_FILE_SIZE'
            ? 'Ukuran file terlalu besar (maks 512KB)'
            : 'Gagal mengunggah file';
        return res.status(400).json({ status: 'fail', message });
      }

      return res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
}

module.exports = AlbumsHandler;
