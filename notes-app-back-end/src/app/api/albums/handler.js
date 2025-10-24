const ClientError = require('../../utils/error/ClientError');
const fs = require('fs');
const path = require('path');
class AlbumsHandler {
  constructor(service, validator, songsService) {
    this._service = service;
    this._validator = validator;
    this._songsService = songsService;
    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.uploadAlbumCoverHandler = this.uploadAlbumCoverHandler.bind(this);
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

  async postUploadCover(req, res) {
    try {
      const { id } = req.params;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ status: 'fail', message: 'File tidak ditemukan' });
      }

      const fileSize = file.size;
      if (fileSize > 512000) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ status: 'fail', message: 'Ukuran file maksimal 512KB' });
      }

      if (!file.mimetype.startsWith('image/')) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ status: 'fail', message: 'File harus berupa gambar' });
      }

      // Simpan file ke uploads
      const newFileName = `${id}-${Date.now()}${path.extname(file.originalname)}`;
      const newPath = path.join('uploads', newFileName);
      fs.renameSync(file.path, newPath);

      // Simpan URL ke database
      const coverUrl = `${process.env.SERVER_URL || ''}/uploads/${newFileName}`;
      await this._service.updateCoverUrl(id, coverUrl);

      return res.status(201).json({
        status: 'success',
        message: 'Sampul berhasil diunggah',
        coverUrl,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
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
