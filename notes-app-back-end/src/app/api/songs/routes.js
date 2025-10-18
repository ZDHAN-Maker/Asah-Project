const express = require('express');
const authMiddleware = require('../../middleware/authmiddleware');

const createSongsRouter = (handler) => {
  const router = express.Router();

  router.post('/', (req, res) => handler.postSongHandler(req, res));
  router.get('/', (req, res) => handler.getSongsHandler(req, res));
  router.get('/:id', (req, res) => handler.getSongByIdHandler(req, res));
  router.put('/:id', (req, res) => handler.putSongByIdHandler(req, res));
  router.delete('/:id', (req, res) => handler.deleteSongByIdHandler(req, res));

  return router;
};

module.exports = createSongsRouter;
