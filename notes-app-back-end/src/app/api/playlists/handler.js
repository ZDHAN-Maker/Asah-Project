const ClientError = require('../../utils/error/ClientError');
const InvariantError = require('../../utils/error/InvariantError');
const NotFoundError = require('../../utils/error/NotFoundError');
const AuthorizationError = require('../../utils/error/AuthorizationError');
const PlaylistsService = require('../../services/PlayListsService');
const { validateCreate, validateSongPayload } = require('./validator');

class PlaylistsHandler {
  constructor() {
    this.playlistsService = new PlaylistsService();
  }

  async postPlaylist(req, res) {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      validateCreate(req.body);

      const id = await this.playlistsService.create({
        name: req.body.name,
        owner: req.auth.userId,
      });

      return res.status(201).json({
        status: 'success',
        data: { playlistId: id },
      });
    } catch (e) {
      if (e instanceof InvariantError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      if (e instanceof ClientError) {
        return res.status(e.statusCode || 400).json({ status: 'fail', message: e.message });
      }

      console.error('Unexpected error in postPlaylist:', e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  async getPlaylists(req, res) {
    try {
      const playlists = await this.playlistsService.getForUser(req.auth.userId);
      return res.status(200).json({ status: 'success', data: { playlists } });
    } catch (e) {
      console.error('Unexpected error in getPlaylists:', e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  async deletePlaylist(req, res) {
    try {
      await this.playlistsService.delete(req.params.id, req.auth.userId);
      return res.status(200).json({ status: 'success', message: 'Playlist berhasil dihapus' });
    } catch (e) {
      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }

      if (e instanceof ClientError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      console.error('Unexpected error in deletePlaylist:', e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  async postSong(req, res) {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      validateSongPayload(req.body);
      await this.playlistsService.addSong(req.params.id, req.body.songId, req.auth.userId);

      return res.status(201).json({
        status: 'success',
        message: 'Lagu berhasil ditambahkan ke playlist',
      });
    } catch (e) {
      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }

      if (e instanceof InvariantError || e instanceof ClientError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      console.error('Unexpected error in postSong handler:', e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  async getSongs(req, res) {
    try {
      const result = await this.playlistsService.getSongs(req.params.id, req.auth.userId);

      return res.status(200).json({
        status: 'success',
        data: result.data,
      });
    } catch (e) {
      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }

      console.error('Unexpected error in getSongs handler:', e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  async deleteSong(req, res) {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      // 🔹 Gunakan validator yang sama seperti postSong
      validateSongPayload(req.body);
      const { songId } = req.body;

      await this.playlistsService.deleteSong(req.params.id, songId, req.auth.userId);

      return res.status(200).json({
        status: 'success',
        message: 'Lagu berhasil dihapus dari playlist',
      });
    } catch (e) {
      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }

      if (e instanceof InvariantError || e instanceof ClientError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      console.error('Unexpected error in deleteSong handler:', e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  async getActivities(req, res) {
    try {
      const activities = await this.playlistsService.getActivities(req.params.id, req.auth.userId);
      return res.status(200).json({
        status: 'success',
        data: {
          playlistId: req.params.id,
          activities,
        },
      });
    } catch (e) {
      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }

      console.error('Unexpected error in getActivities:', e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }
}

module.exports = PlaylistsHandler;
