const express = require('express');
const auth = require('../../middleware/authmiddleware');
const { checkPlaylistOwnership, exportPlaylist } = require('../../services/playlistExportService');

const createPlaylistsRouter = (handler) => {
  const r = express.Router();

  r.post('/playlists', auth, (req, res) => handler.postPlaylist(req, res));
  r.get('/playlists', auth, (req, res) => handler.getPlaylists(req, res));
  r.delete('/playlists/:id', auth, (req, res) => handler.deletePlaylist(req, res));
  r.post('/playlists/:id/songs', auth, (req, res) => handler.postSong(req, res));
  r.get('/playlists/:id/songs', auth, (req, res) => handler.getSongs(req, res));
  r.delete('/playlists/:id/songs', auth, (req, res) => handler.deleteSong(req, res));
  r.get('/playlists/:id/activities', auth, (req, res) => handler.getActivities(req, res));

  // Export playlist ke email
  r.post('/export/playlists/:playlistId', auth, async (req, res) => {
    try {
      const { playlistId } = req.params;
      const { targetEmail } = req.body;

      // Validasi pemilik playlist
      const isOwner = await checkPlaylistOwnership(playlistId, req.user.id);
      if (!isOwner) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not the owner of this playlist',
        });
      }

      // Kirimkan permintaan ke RabbitMQ (atau service lain)
      await exportPlaylist(playlistId, targetEmail);

      return res.status(201).json({
        status: 'success',
        message: 'Permintaan Anda sedang kami proses',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat memproses permintaan',
      });
    }
  });

  return r;
};

module.exports = createPlaylistsRouter;
