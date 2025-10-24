const fs = require('fs');
const path = require('path');
const ClientError = require('../../utils/error/ClientError');
const NotFoundError = require('../../utils/error/NotFoundError');
const validateAlbum = require('./validator');

class AlbumsHandler {
  constructor(service, validator, songsService, likesService) {
    this._service = service;
    this._songsService = songsService;
    this._likesService = likesService;

    // Bind the handler methods
    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postUploadCover = this.postUploadCover.bind(this);
    this.postLikeAlbum = this.postLikeAlbum.bind(this);
    this.deleteLikeAlbum = this.deleteLikeAlbum.bind(this);
    this.getAlbumLikes = this.getAlbumLikes.bind(this);
  }

  // POST /albums
  async postAlbumHandler(req, res) {
    try {
      // Call validateAlbum function directly
      validateAlbum(req.body); // Validate the album data using the validator function

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
        throw new NotFoundError('Album tidak ditemukan', 404);
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
      console.error('getAlbumByIdHandler error:', error);
      if (error instanceof NotFoundError) {
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

  // PUT /albums/{id}
  async putAlbumByIdHandler(req, res) {
    try {
      validateAlbum(req.body); // Validate album data here
      const { id } = req.params;

      await this._service.editAlbumById(id, req.body);
      return res.status(200).json({
        status: 'success',
        message: 'Album berhasil diperbarui',
      });
    } catch (error) {
      console.error('putAlbumByIdHandler error:', error);
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

  // DELETE /albums/{id}
  async deleteAlbumByIdHandler(req, res) {
    try {
      const { id } = req.params;
      await this._service.deleteAlbumById(id);
      return res.status(200).json({
        status: 'success',
        message: 'Album berhasil dihapus',
      });
    } catch (error) {
      console.error('deleteAlbumByIdHandler error:', error);
      if (error instanceof NotFoundError) {
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

  // POST /albums/{id}/cover
  async postUploadCover(req, res) {
    try {
      const { id } = req.params;
      const { file } = req;

      if (!file) {
        throw new ClientError('File tidak ditemukan', 400);
      }

      const { size, mimetype, originalname, path: tempPath } = file;

      // Validasi ukuran file
      if (size > 512000) {
        fs.unlinkSync(tempPath);
        throw new ClientError('Ukuran file maksimal 512KB', 400);
      }

      // Validasi tipe file
      if (!mimetype.startsWith('image/')) {
        fs.unlinkSync(tempPath);
        throw new ClientError('File harus berupa gambar', 400);
      }

      // Simpan file ke folder uploads
      const newFileName = `${id}-${Date.now()}${path.extname(originalname)}`;
      const newPath = path.join('uploads', newFileName);
      fs.renameSync(tempPath, newPath);

      // Simpan URL ke database
      const serverUrl = process.env.SERVER_URL || '';
      const coverUrl = `${serverUrl}/uploads/${newFileName}`;

      await this._service.updateCoverUrl(id, coverUrl);

      return res.status(201).json({
        status: 'success',
        message: 'Sampul berhasil diunggah',
        coverUrl,
      });
    } catch (e) {
      console.error('Error in postUploadCover:', e);

      if (e instanceof ClientError) {
        return res.status(e.statusCode || 400).json({
          status: 'fail',
          message: e.message,
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }

  // Menyukai album
  async postLikeAlbum(req, res) {
    try {
      const { id: albumId } = req.params;
      const userId = req.user.id;
      await this._likesService.likeAlbum(albumId, userId);
      return res.status(201).json({ status: 'success', message: 'Album disukai' });
    } catch (e) {
      if (e.message.includes('sudah menyukai')) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }
      console.error(e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
    }
  }

  // Batal menyukai album
  async deleteLikeAlbum(req, res) {
    try {
      const { id: albumId } = req.params;
      const userId = req.user.id;
      await this._likesService.unlikeAlbum(albumId, userId);
      return res.status(200).json({ status: 'success', message: 'Batal menyukai album' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
    }
  }

  // Mendapatkan jumlah yang menyukai album
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
    } catch (e) {
      console.error(e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
    }
  }
}

module.exports = AlbumsHandler;
