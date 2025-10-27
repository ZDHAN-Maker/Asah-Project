const express = require('express');
const authMiddleware = require('../../middleware/authmiddleware');

function createAlbumsRouter(handler) {
  const router = express.Router();

  // === CRUD Albums ===
  router.post('/', handler.postAlbumHandler);
  router.get('/:id', handler.getAlbumByIdHandler);
  router.put('/:id', handler.putAlbumByIdHandler);
  router.delete('/:id', handler.deleteAlbumByIdHandler);

  // === Upload Cover ===
  router.post('/:id/covers', handler.postUploadCover);

  // === Likes (Perlu Autentikasi) ===
  router.post('/:id/likes', authMiddleware, handler.postLikeAlbum);
  router.delete('/:id/likes', authMiddleware, handler.deleteLikeAlbum);

  // === Get Like Count (Boleh tanpa auth) ===
  router.get('/:id/likes', handler.getAlbumLikes);

  return router;
}

module.exports = createAlbumsRouter;
