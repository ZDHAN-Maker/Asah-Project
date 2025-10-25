const express = require('express');
const auth = require('../../middleware/authmiddleware');

const createPlaylistsRouter = (handler) => {
  const r = express.Router();

  // use relative paths because we'll mount this router at '/playlists'
  r.post('/', auth, (req, res) => handler.postPlaylist(req, res));
  r.get('/', auth, (req, res) => handler.getPlaylists(req, res));
  r.delete('/:id', auth, (req, res) => handler.deletePlaylist(req, res));
  r.post('/:id/songs', auth, (req, res) => handler.postSong(req, res));
  r.get('/:id/songs', auth, (req, res) => handler.getSongs(req, res));
  r.delete('/:id/songs', auth, (req, res) => handler.deleteSong(req, res));
  r.get('/:id/activities', auth, (req, res) => handler.getActivities(req, res));
  // export route: mounted as /playlists/export/:id
  r.post('/export/:id', auth, (req, res) => handler.postExportPlaylist(req, res));

  return r;
};

module.exports = createPlaylistsRouter;
