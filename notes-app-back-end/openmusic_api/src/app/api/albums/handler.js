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
    try {
      // Jalankan upload dengan Promise
      await uploadCover(req, res);

      // Pastikan file ada - ini harus dicek SETELAH upload
      if (!req.file) {
        return res.status(400).json({
          status: 'fail',
          message: 'File cover belum diunggah',
        });
      }

      // Simpan ke database
      const albumId = req.params.id;
      const filePath = `uploads/covers/${req.file.filename}`;

      const updateResult = await this._service.updateAlbumCover(albumId, filePath);

      if (!updateResult) {
        // Hapus file jika update database gagal
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          status: 'fail',
          message: 'Album tidak ditemukan',
        });
      }

      // Retrieve updated album from the database to ensure coverUrl is updated
      const updatedAlbum = await this._service.getAlbumById(albumId);

      return res.status(201).json({
        status: 'success',
        message: 'Cover album berhasil diunggah.',
        data: {
          albumId,
          coverUrl: updatedAlbum.coverUrl, // Ensure the coverUrl is correct here
        },
      });
    } catch (error) {
      console.log('Upload Error Code:', error.code);
      console.log('Upload Error Message:', error.message);

      // Tangani error Multer
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

      // Error ketika tidak ada file yang diupload (no image)
      if (error.message && error.message.includes('No files were uploaded')) {
        return res.status(400).json({
          status: 'fail',
          message: 'File cover belum diunggah',
        });
      }

      // Error Multer lainnya
      if (error.code) {
        return res.status(400).json({
          status: 'fail',
          message: `Gagal mengunggah file: ${error.message}`,
        });
      }

      // Error umum
      console.error('Unexpected error:', error);
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
        return res.status(401).json({ status: 'fail', message: 'Missing authentication' });
      }

      const album = await this._service.getAlbumById(albumId);
      if (!album) {
        return res.status(404).json({ status: 'fail', message: 'Album not found' });
      }

      const already = await this._likesService.checkUserLike(albumId, userId);
      if (already) {
        return res.status(400).json({ status: 'fail', message: 'User already liked this album' });
      }

      await this._likesService.likeAlbum(albumId, userId);
      return res.status(201).json({ status: 'success', message: 'Album liked successfully' });
    } catch (error) {
      if (error?.name === 'NotFoundError') {
        return res
          .status(404)
          .json({ status: 'fail', message: error.message || 'Album not found' });
      }

      if (error?.code === 'DUPLICATE_LIKE') {
        return res.status(400).json({ status: 'fail', message: 'User already liked this album' });
      }

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

      return res
        .status(500)
        .json({ status: 'error', message: 'Server error while unliking album' });
    }
  }

  // === GET /albums/{id}/likes ===
  async getAlbumLikes(req, res) {
    try {
      const { id: albumId } = req.params;

      await this._service.getAlbumById(albumId);

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
      if (error?.name === 'NotFoundError') {
        return res.status(404).json({ status: 'fail', message: error.message });
      }

      return res
        .status(500)
        .json({ status: 'error', message: 'Server error while getting like count' });
    }
  }
}

module.exports = AlbumsHandler;
