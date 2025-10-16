const ClientError = require('../../utils/error/ClientError');
const PlaylistsService = require('../../services/PlayListsService'); // Mengimpor PlaylistsService
const InvariantError = require('../../utils/error/InvariantError');
const { validateCreate, validateSongPayload } = require('./validator');

class PlaylistsHandler {
  constructor() {
    this.playlistsService = new PlaylistsService();
  }

  // POST /playlists
  async postPlaylist(req, res) {
    try {
      validateCreate(req.body); // Validasi input yang dikirim

      const id = await this.playlistsService.create({
        name: req.body.name,
        owner: req.auth.userId,
      });

      // Jika berhasil, kembalikan response status 201
      return res.status(201).json({
        status: 'success',
        data: { playlistId: id },
      });
    } catch (e) {
      if (e instanceof InvariantError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      if (e instanceof ClientError) {
        return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      }

      console.error(e); // Log error untuk debugging lebih lanjut
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // GET /playlists
  async getPlaylists(req, res) {
    try {
      const playlists = await this.playlistsService.getForUser(req.auth.userId);
      return res.status(200).json({ status: 'success', data: { playlists } });
    } catch (e) {
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // DELETE /playlists/:id
  async deletePlaylist(req, res) {
    try {
      await this.playlistsService.delete(req.params.id, req.auth.userId);
      return res.status(200).json({ status: 'success', message: 'Playlist berhasil dihapus' });
    } catch (e) {
      if (e instanceof ClientError) {
        return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      }
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // POST/GET/DELETE /playlists/:id/songs
  async postSong(req, res) {
    try {
      validateSongPayload(req.body);
      await this.playlistsService.addSong(req.params.id, req.body.songId, req.auth.userId);

      return res.status(201).json({
        status: 'success',
        message: 'Lagu berhasil ditambahkan ke playlist',
      });
    } catch (e) {
      if (e instanceof ClientError) {
        // Pastikan e.statusCode integer valid (400/403/404/409/422, dst.)
        return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      }
      console.error('Unexpected error in postSong handler:', e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  async getSongs(req, res) {
    try {
      const playlist = await this.playlistsService.getSongs(req.params.id, req.auth.userId);
      return res.status(200).json({
        status: 'success',
        data: { playlist },
      });
    } catch (e) {
      if (e instanceof ClientError) {
        return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      }
      console.error('Unexpected error in getSongs handler:', e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  async deleteSong(req, res) {
    try {
      validateSongPayload(req.body);
      await this.playlistsService.deleteSong(req.params.id, req.body.songId, req.auth.userId);
      return res
        .status(200)
        .json({ status: 'success', message: 'Lagu berhasil dihapus dari playlist' });
    } catch (e) {
      if (e instanceof ClientError) {
        return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      }
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // [opsional] GET /playlists/:id/activities
  async getActivities(req, res) {
    try {
      const activities = await this.playlistsService.getActivities(req.params.id, req.auth.userId);
      return res.status(200).json({ status: 'success', data: { activities } });
    } catch (e) {
      if (e instanceof ClientError) {
        return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      }
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }
}

module.exports = PlaylistsHandler;
