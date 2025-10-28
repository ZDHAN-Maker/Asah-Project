const fs = require('fs');
const ClientError = require('../../utils/error/ClientError');
const NotFoundError = require('../../utils/error/NotFoundError');
const { uploadCover } = require('../../utils/upload');
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
    if (!album) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    return album;
  }

  // === POST /albums ===
  async postAlbumHandler(req, res) {
    try {
      validateAlbum(req.body);
      const albumId = await this._service.addAlbum(req.body);

      return res.status(201).json({
        status: 'success',
        data: { albumId },
      });
    } catch (error) {
      return this._handleError(res, error, 'Terjadi kesalahan pada server');
    }
  }

  // === GET /albums/{id} ===
  async getAlbumByIdHandler(req, res) {
    try {
      const { id } = req.params;
      const album = await this._validateAlbumExists(id);

      const { name, year, coverUrl, songs } = album;
      return res.status(200).json({
        status: 'success',
        data: { album: { id, name, year, coverUrl, songs } },
      });
    } catch (error) {
      return this._handleError(res, error, 'Terjadi kesalahan pada server');
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
      await uploadCover(req, res);

      if (!req.file) {
        return res.status(400).json({
          status: 'fail',
          message: 'File cover belum diunggah',
        });
      }

      const albumId = req.params.id;
      const filePath = `uploads/covers/${req.file.filename}`;

      const updateResult = await this._service.updateAlbumCover(albumId, filePath);

      if (!updateResult) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          status: 'fail',
          message: 'Album tidak ditemukan',
        });
      }

      const updatedAlbum = await this._service.getAlbumById(albumId);

      return res.status(201).json({
        status: 'success',
        message: 'Cover album berhasil diunggah.',
        data: {
          albumId,
          coverUrl: updatedAlbum.coverUrl,
        },
      });
    } catch (error) {
      // Handle Multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          status: 'fail',
          message: 'File terlalu besar (maks 512KB)',
        });
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          status: 'fail',
          message: 'Tipe file harus berupa gambar (png, jpg, jpeg, webp)',
        });
      }

      if (error.message?.includes('No files were uploaded')) {
        return res.status(400).json({
          status: 'fail',
          message: 'File cover belum diunggah',
        });
      }

      if (error.code) {
        return res.status(400).json({
          status: 'fail',
          message: `Gagal mengunggah file: ${error.message}`,
        });
      }

      console.error('Upload Error:', error);
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
      if (error?.code === 'DUPLICATE_LIKE') {
        return res.status(400).json({
          status: 'fail',
          message: 'User already liked this album',
        });
      }

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
      if (result.fromCache) {
        response.set('X-Data-Source', 'cache');
      }

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
