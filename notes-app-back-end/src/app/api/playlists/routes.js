const express = require('express');
const auth = require('../../middleware/authmiddleware');

const createPlaylistsRouter = (handler) => {
  const r = express.Router();

  r.post('/playlists', auth, (req, res) => handler.postPlaylist(req, res));
  r.get('/playlists', auth, (req, res) => handler.getPlaylists(req, res));
  r.delete('/playlists/:id', auth, (req, res) => handler.deletePlaylist(req, res));
  r.post('/playlists/:id/songs', auth, (req, res) => handler.postSong(req, res));
  r.get('/playlists/:id/songs', auth, (req, res) => handler.getSongs(req, res));
  r.delete('/playlists/:id/songs', auth, (req, res) => handler.deleteSong(req, res));
  r.get('/playlists/:id/activities', auth, (req, res) => handler.getActivities(req, res));
  return r;
};

module.exports = createPlaylistsRouter;
