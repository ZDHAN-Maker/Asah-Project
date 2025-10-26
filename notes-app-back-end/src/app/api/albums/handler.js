const path = require('path');
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

  // === POST /albums/{id}/covers ===
  async postUploadCover(req, res) {
    uploadCover(req, res, async (err) => {
      try {
        // Menangani error jika ukuran file terlalu besar
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              status: 'fail',
              message: 'Ukuran file terlalu besar (maks 512kb)',
            });
          }

          // Menangani error jika tipe file tidak valid
          if (err.message === 'Tipe konten harus gambar') {
            return res.status(400).json({
              status: 'fail',
              message: 'Tipe file harus berupa gambar (png, jpg, jpeg, webp)',
            });
          }

          return res.status(400).json({
            status: 'fail',
            message: err.message || 'Gagal mengunggah file',
          });
        }

        // Memeriksa apakah file berhasil diunggah
        if (!req.file) {
          return res.status(400).json({
            status: 'fail',
            message: 'File cover belum diunggah',
          });
        }

        // Mendapatkan path file yang diunggah
        const filePath = path.join('uploads', 'covers', req.file.filename);

        // Memperbarui cover album
        const albumId = await this._service.updateAlbumCover(req.params.id, filePath);

        return res.status(201).json({
          status: 'success',
          message: 'Sampul album berhasil diunggah',
          data: {
            albumId,
            coverUrl: filePath,
          },
        });
      } catch (error) {
        console.error('Upload cover error:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Gagal memperbarui cover album',
        });
      }
    });
  }

  // === POST /albums/{id}/likes ===
  async postLikeAlbum(req, res) {
    try {
      const { id: albumId } = req.params;
      const userId = req.auth?.userId;

      // Cek autentikasi user
      if (!userId) {
        return res.status(401).json({ status: 'fail', message: 'Missing authentication' });
      }

      // Cek apakah album ada
      const album = await this._service.getAlbumById(albumId);
      if (!album) {
        return res.status(404).json({ status: 'fail', message: 'Album not found' });
      }

      // Cek apakah user sudah menyukai album
      const already = await this._likesService.checkUserLike(albumId, userId);
      if (already) {
        return res.status(400).json({ status: 'fail', message: 'User already liked this album' });
      }

      // Proses like album
      await this._likesService.likeAlbum(albumId, userId);
      return res.status(201).json({ status: 'success', message: 'Album liked successfully' });
    } catch (error) {
      // Menangani error jika album tidak ditemukan
      if (error?.name === 'NotFoundError') {
        return res
          .status(404)
          .json({ status: 'fail', message: error.message || 'Album not found' });
      }

      // Menangani error jika user sudah menyukai album
      if (error?.code === 'DUPLICATE_LIKE') {
        return res.status(400).json({ status: 'fail', message: 'User already liked this album' });
      }

      // Menangani error lainnya
      console.error('postLikeAlbum error:', error);
      return res.status(500).json({ status: 'error', message: 'Server error while liking album' });
    }
  }

  // === DELETE /albums/{id}/likes ===
  async deleteLikeAlbum(req, res) {
    try {
      const { id: albumId } = req.params;
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ status: 'fail', message: 'Missing authentication' });
      }

      await this._service.getAlbumById(albumId);

      const already = await this._likesService.checkUserLike(albumId, userId);
      if (!already) {
        return res.status(400).json({ status: 'fail', message: 'User has not liked this album' });
      }

      await this._likesService.unlikeAlbum(albumId, userId);
      return res.status(200).json({ status: 'success', message: 'Album unliked successfully' });
    } catch (error) {
      if (error?.name === 'NotFoundError') {
        return res
          .status(404)
          .json({ status: 'fail', message: error.message || 'Album not found' });
      }
      // eslint-disable-next-line no-console
      console.error('deleteLikeAlbum error:', error);
      return res
        .status(500)
        .json({ status: 'error', message: 'Server error while unliking album' });
    }
  }

  // === GET /albums/{id}/likes ===
  async getAlbumLikes(req, res) {
    try {
      const { id: albumId } = req.params;

      // pastikan album ada
      await this._service.getAlbumById(albumId);

      const result = await this._likesService.getLikesCount(albumId);

      const response = res.status(200);
      if (result.fromCache) {
        response.set('X-Data-Source', 'cache'); // hanya saat dari cache
      }

      return response.json({
        status: 'success',
        data: { likes: result.count },
      });
    } catch (error) {
      if (error?.name === 'NotFoundError') {
        return res.status(404).json({ status: 'fail', message: error.message });
      }
      // eslint-disable-next-line no-console
      console.error(error);
      return res
        .status(500)
        .json({ status: 'error', message: 'Server error while getting like count' });
    }
  }
}

module.exports = AlbumsHandler;
