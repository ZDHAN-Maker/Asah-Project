const express = require('express');
const { uploadCover } = require('../../utils/upload');
const authMiddleware = require('../../middleware/authmiddleware');

function createAlbumsRouter(handler) {
  const router = express.Router();

  router.post('/', handler.postAlbumHandler);
  router.get('/:id', handler.getAlbumByIdHandler);
  router.put('/:id', handler.putAlbumByIdHandler);
  router.delete('/:id', handler.deleteAlbumByIdHandler);

  // Upload cover
  router.post('/:id/covers', uploadCover, handler.postUploadCover);

  router.post('/:id/likes', authMiddleware, handler.postLikeAlbum);
  router.delete('/:id/likes', authMiddleware, handler.deleteLikeAlbum);
  router.get('/:id/likes', handler.getAlbumLikes);

  return router;
}

module.exports = createAlbumsRouter;
