const ClientError = require('../../utils/error/ClientError');
const InvariantError = require('../../utils/error/InvariantError');
const NotFoundError = require('../../utils/error/NotFoundError');
const AuthorizationError = require('../../utils/error/AuthorizationError');
const { validateCreate, validateSongPayload } = require('./validator');

class PlaylistsHandler {
  constructor(playlistsService, collaborationsService) {
    this._playlistsService = playlistsService;
    this._collaborationsService = collaborationsService;
  }

  // Fungsi untuk membuat playlist
  async postPlaylist(req, res) {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      validateCreate(req.body);

      const id = await this._playlistsService.create({
        name: req.body.name,
        owner: req.auth.userId,
      });

      return res.status(201).json({
        status: 'success', // Respons status 'success' untuk berhasil
        data: { playlistId: id },
      });
    } catch (e) {
      if (e instanceof InvariantError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      if (e instanceof ClientError) {
        return res.status(e.statusCode || 400).json({ status: 'fail', message: e.message });
      }

      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // Fungsi untuk menambahkan lagu ke playlist
  async postSong(req, res) {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      validateSongPayload(req.body);
      await this._playlistsService.addSong(req.params.id, req.body.songId, req.auth.userId);

      return res.status(201).json({
        status: 'success', // Respons status 'success' untuk berhasil
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

      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // Fungsi untuk mengambil playlist milik user
  async getPlaylists(req, res) {
    try {
      const playlists = await this._playlistsService.getForUser(req.auth.userId);
      return res.status(200).json({
        // Respons status 'success' untuk berhasil
        status: 'success',
        data: { playlists },
      });
    } catch (e) {
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // Fungsi untuk menghapus playlist
  async deletePlaylist(req, res) {
    try {
      await this._playlistsService.delete(req.params.id, req.auth.userId);

      return res.status(200).json({
        // Respons status 'success' untuk berhasil
        status: 'success',
        message: 'Playlist berhasil dihapus',
      });
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

      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // Fungsi untuk menghapus lagu dari playlist
  async deleteSong(req, res) {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      validateSongPayload(req.body);
      const { songId } = req.body;

      await this._playlistsService.deleteSong(req.params.id, songId, req.auth.userId);

      return res.status(200).json({
        status: 'success', // Respons status 'success' untuk berhasil
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

      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // Fungsi untuk mengambil lagu dari playlist
  async getSongs(req, res) {
    try {
      const result = await this._playlistsService.getSongs(req.params.id, req.auth.userId);

      return res.status(200).json({
        status: 'success', // Respons status 'success' untuk berhasil
        data: result.data,
      });
    } catch (e) {
      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }

      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // Fungsi untuk mengambil aktivitas playlist
  async getActivities(req, res) {
    try {
      const activities = await this._playlistsService.getActivities(req.params.id, req.auth.userId);
      return res.status(200).json({
        status: 'success', // Respons status 'success' untuk berhasil
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

      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // Fungsi untuk mengekspor playlist
  async postExportPlaylist(req, res) {
    try {
      const {
        params: { id },
        body: { targetEmail } = {},
        auth: { userId },
      } = req;

      if (!targetEmail || typeof targetEmail !== 'string') {
        return res.status(400).json({
          status: 'fail',
          message: 'targetEmail is required',
        });
      }

      await this._playlistsService.verifyPlaylistOwner(id, userId);
      await this._playlistsService.exportPlaylist(id, targetEmail);

      return res.status(201).json({
        status: 'success', // Respons status 'success' untuk berhasil
        message: 'Permintaan Anda sedang kami proses',
      });
    } catch (e) {
      if (e instanceof ClientError) {
        return res.status(e.statusCode || 400).json({
          status: 'fail',
          message: e.message,
        });
      }
      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }
      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }
}

module.exports = PlaylistsHandler;
