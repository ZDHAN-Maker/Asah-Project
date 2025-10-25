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

  async postPlaylist(req, res) {
    try {
      const { userId } = req.auth;
      validateCreate(req.body);

      const id = await this._playlistsService.create({
        name: req.body.name,
        owner: userId,
      });

      return res.status(201).json({
        status: 'success',
        data: { playlistId: id },
      });
    } catch (e) {
      if (e instanceof ClientError) {
        return res.status(e.statusCode || 400).json({
          status: 'fail',
          message: e.message,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }

  async postSong(req, res) {
    try {
      const { userId } = req.auth;
      const { id: playlistId } = req.params;
      validateSongPayload(req.body);

      const playlistSongId = await this._playlistsService.addSong(
        playlistId,
        req.body.songId,
        userId,
      );

      return res.status(201).json({
        status: 'success',
        message: 'Lagu berhasil ditambahkan ke playlist',
        data: { playlistSongId },
      });
    } catch (e) {
      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }
      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }
      if (e instanceof InvariantError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }

  async getPlaylists(req, res) {
    try {
      const { userId } = req.auth;
      const playlists = await this._playlistsService.getForUser(userId);

      return res.status(200).json({
        status: 'success',
        data: { playlists },
      });
    } catch (e) {
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }

  async deletePlaylist(req, res) {
    try {
      const { userId } = req.auth;
      const { id: playlistId } = req.params;

      const deletedPlaylistId = await this._playlistsService.delete(playlistId, userId);

      return res.status(200).json({
        status: 'success',
        message: 'Playlist berhasil dihapus',
        data: { deletedPlaylistId },
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
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server saat menghapus playlist',
      });
    }
  }

  async deleteSong(req, res) {
    try {
      const { userId } = req.auth;
      const { id: playlistId } = req.params;
      validateSongPayload(req.body);

      const deletedSongId = await this._playlistsService.deleteSong(
        playlistId,
        req.body.songId,
        userId,
      );

      return res.status(200).json({
        status: 'success',
        message: 'Lagu berhasil dihapus dari playlist',
        data: { deletedSongId },
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
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server saat menghapus lagu',
      });
    }
  }

  async getSongs(req, res) {
    try {
      const { userId } = req.auth;
      const { id } = req.params;
      const result = await this._playlistsService.getSongs(id, userId);

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
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }

  async getActivities(req, res) {
    try {
      const { userId } = req.auth;
      const { id } = req.params;
      const activities = await this._playlistsService.getActivities(id, userId);

      return res.status(200).json({
        status: 'success',
        data: {
          playlistId: id,
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
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }

  async postExportPlaylist(req, res) {
    try {
      const { id: playlistId } = req.params;
      const { userId } = req.auth;
      const { targetEmail } = req.body;

      const result = await this._playlistsService.exportPlaylist(
        playlistId,
        userId,
        targetEmail,
      );

      return res.status(201).json({
        status: 'success',
        message: result.message,
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
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan server',
      });
    }
  }
}

module.exports = PlaylistsHandler;
