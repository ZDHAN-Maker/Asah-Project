const express = require('express');
const multer = require('multer');

function createAlbumsRouter(handler) {
  const router = express.Router();

  // Konfigurasi multer
  const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 512000 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Hanya file gambar yang diperbolehkan'));
      }
      cb(null, true);
    },
  }).single('cover');

  // CRUD routes
  router.post('/', handler.postAlbumHandler);
  router.get('/:id', handler.getAlbumByIdHandler);
  router.put('/:id', handler.putAlbumByIdHandler);
  router.delete('/:id', handler.deleteAlbumByIdHandler);
  router.post('/:id/covers', upload, handler.uploadAlbumCoverHandler);
  // Route upload cover
  router.post('/albums/:id/covers', auth, upload, (req, res) => handler.postUploadCover(req, res));

  // Route like/unlike/get likes
  router.post('/albums/:id/likes', auth, (req, res) => handler.postLikeAlbum(req, res));
  router.delete('/albums/:id/likes', auth, (req, res) => handler.deleteLikeAlbum(req, res));
  router.get('/albums/:id/likes', (req, res) => handler.getAlbumLikes(req, res));
  return router;
}

module.exports = createAlbumsRouter;
