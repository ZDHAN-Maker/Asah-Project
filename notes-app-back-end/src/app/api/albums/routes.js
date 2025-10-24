const express = require('express');
const multer = require('multer');

function createAlbumsRouter(handler) {
  const router = express.Router();

  // Konfigurasi multer
  const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 512000 }, // Maks 512 KB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Hanya file gambar yang diperbolehkan'));
      }
      cb(null, true);
    },
  }).single('cover');

  // CRUD routes
  router.post('/', (req, res) => handler.postAlbumHandler(req, res));
  router.get('/:id', (req, res) => handler.getAlbumByIdHandler(req, res));
  router.put('/:id', (req, res) => handler.putAlbumByIdHandler(req, res));
  router.delete('/:id', (req, res) => handler.deleteAlbumByIdHandler(req, res));

  // Upload cover dan fitur like
  router.post('/:id/covers', upload, (req, res) => handler.postUploadCover(req, res));
  router.post('/:id/likes', (req, res) => handler.postLikeAlbum(req, res));
  router.delete('/:id/likes', (req, res) => handler.deleteLikeAlbum(req, res));
  router.get('/:id/likes', (req, res) => handler.getAlbumLikes(req, res));

  return router;
}

module.exports = createAlbumsRouter;
