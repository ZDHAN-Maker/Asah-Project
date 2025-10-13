const express = require('express');
const authMiddleware = require('../../middleware/authmiddleware');

const createSongsRouter = (handler) => {
  const router = express.Router();

  router.post('/', authMiddleware, (req, res) => handler.postSongHandler(req, res));
  router.get('/', authMiddleware, (req, res) => handler.getSongsHandler(req, res));
  router.get('/:id', authMiddleware, (req, res) => handler.getSongByIdHandler(req, res));
  router.put('/:id', authMiddleware, (req, res) => handler.putSongByIdHandler(req, res));
  router.delete('/:id', authMiddleware, (req, res) => handler.deleteSongByIdHandler(req, res));

  return router;
};

module.exports = createSongsRouter;
