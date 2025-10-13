const express = require('express');
const authMiddleware = require('../../middleware/authmiddleware');

function createAlbumsRouter(handler) {
  const router = express.Router();

  router.post('/', authMiddleware, handler.postAlbumHandler);

  router.get('/:id', authMiddleware, handler.getAlbumByIdHandler);

  router.put('/:id', authMiddleware, handler.putAlbumByIdHandler);

  router.delete('/:id', authMiddleware, handler.deleteAlbumByIdHandler);

  return router;
}

module.exports = createAlbumsRouter;
