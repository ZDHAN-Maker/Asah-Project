const fs = require('fs');
const path = require('path');
const ClientError = require('../../utils/error/ClientError');

class AlbumsHandler {
  constructor(service, validator, songsService, likesService) {
    this._service = service;
    this._validator = validator;
    this._songsService = songsService;
    this._likesService = likesService;

    // Bind semua method agar `this` tidak hilang saat dipanggil dari router
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
      if (!album) throw new ClientError('Album tidak ditemukan', 404);

      const songs = await this._songsService.getSongsByAlbumId(id);

      return res.status(200).json({
        status: 'success',
        data: {
          album: {
            id: album.id,
            name: album.name,
            year: album.year,
            coverUrl: album.cover_url || null,
            songs,
          },
        },
      });
    } catch (error) {
      console.error('getAlbumByIdHandler error:', error);
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

  // PUT /albums/{id}
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
      return res.json({
        status: 'success',
        message: 'Album berhasil dihapus',
      });
    } catch (error) {
      console.error('deleteAlbumByIdHandler error:', error);
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

  // POST /albums/{id}/covers
  async postUploadCover(req, res) {
    try {
      const { id } = req.params;
      const { file } = req;

      if (!file) throw new ClientError('File tidak ditemukan', 400);

      const { size, mimetype, originalname, path: tempPath } = file;

      if (size > 512000) {
        fs.unlinkSync(tempPath);
        throw new ClientError('Ukuran file maksimal 512KB', 400);
      }

      if (!mimetype.startsWith('image/')) {
        fs.unlinkSync(tempPath);
        throw new ClientError('File harus berupa gambar', 400);
      }

      const newFileName = `${id}-${Date.now()}${path.extname(originalname)}`;
      const newPath = path.join('uploads', newFileName);
      fs.renameSync(tempPath, newPath);

      const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
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

  // POST /albums/{id}/likes
  async postLikeAlbum(req, res) {
    try {
      const { id: albumId } = req.params;
      const userId = req.user.id;
      await this._likesService.likeAlbum(albumId, userId);

      return res.status(201).json({
        status: 'success',
        message: 'Album disukai',
      });
    } catch (e) {
      if (e instanceof ClientError) {
        return res.status(e.statusCode || 400).json({
          status: 'fail',
          message: e.message,
        });
      }

      if (e.message.includes('sudah menyukai')) {
        return res.status(400).json({
          status: 'fail',
          message: e.message,
        });
      }

      console.error(e);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }

  // DELETE /albums/{id}/likes
  async deleteLikeAlbum(req, res) {
    try {
      const { id: albumId } = req.params;
      const userId = req.user.id;
      await this._likesService.unlikeAlbum(albumId, userId);

      return res.status(200).json({
        status: 'success',
        message: 'Batal menyukai album',
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }

  // GET /albums/{id}/likes
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
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }
}

module.exports = AlbumsHandler;
