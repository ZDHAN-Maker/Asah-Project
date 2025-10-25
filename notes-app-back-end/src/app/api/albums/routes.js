const express = require('express');
const multer = require('multer');

function createAlbumsRouter(handler) {
  const router = express.Router();

  // Konfigurasi upload (dipakai di handler)
  const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 512000 },
  });

  // === CRUD Albums ===
  router.post('/', handler.postAlbumHandler);
  router.get('/:id', handler.getAlbumByIdHandler);
  router.put('/:id', handler.putAlbumByIdHandler);
  router.delete('/:id', handler.deleteAlbumByIdHandler);

  // === Upload Cover (middleware upload + handler) ===
  router.post('/:id/covers', upload.single('cover'), handler.postUploadCover);

  // === Likes ===
  router.post('/:id/likes', handler.postLikeAlbum);
  router.delete('/:id/likes', handler.deleteLikeAlbum);
  router.get('/:id/likes', handler.getAlbumLikes);

  return router;
}

module.exports = createAlbumsRouter;
