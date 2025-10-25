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
      console.log('=== POST PLAYLIST DEBUG ===');
      console.log('Request Body:', req.body);
      console.log('User ID:', req.auth.userId);

      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      validateCreate(req.body);

      const id = await this._playlistsService.create({
        name: req.body.name,
        owner: req.auth.userId,
      });

      return res.status(201).json({
        status: 'success',
        data: { playlistId: id },
      });
    } catch (e) {
      console.error('Error in postPlaylist:', e.message);

      if (e instanceof InvariantError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      if (e instanceof ClientError) {
        return res.status(e.statusCode || 400).json({ status: 'fail', message: e.message });
      }

      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // Fungsi untuk menambahkan lagu ke playlist - PERBAIKAN
  async postSong(req, res) {
    try {
      console.log('=== POST ADD SONG DEBUG ===');
      console.log('Playlist ID:', req.params.id);
      console.log('Request Body:', req.body);
      console.log('User ID:', req.auth.userId);

      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid payload: Body harus berupa object JSON',
        });
      }

      // Validasi payload dengan Joi
      validateSongPayload(req.body);

      const playlistSongId = await this._playlistsService.addSong(
        req.params.id,
        req.body.songId,
        req.auth.userId
      );

      return res.status(201).json({
        status: 'success',
        message: 'Lagu berhasil ditambahkan ke playlist',
        data: { playlistSongId },
      });
    } catch (e) {
      console.error('ERROR in postSong:', e.message);
      console.error('Error stack:', e.stack);

      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }

      if (e instanceof InvariantError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      if (e instanceof ClientError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server: ' + e.message,
      });
    }
  }

  // Fungsi untuk mengambil playlist milik user
  async getPlaylists(req, res) {
    try {
      console.log('=== GET PLAYLISTS DEBUG ===');
      console.log('User ID:', req.auth.userId);

      const playlists = await this._playlistsService.getForUser(req.auth.userId);

      return res.status(200).json({
        status: 'success',
        data: { playlists },
      });
    } catch (e) {
      console.error('Error in getPlaylists:', e.message);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }

  // Fungsi untuk menghapus playlist - PERBAIKAN
  async deletePlaylist(req, res) {
    try {
      console.log('=== DELETE PLAYLIST HANDLER DEBUG ===');
      console.log('Playlist ID:', req.params.id);
      console.log('User ID:', req.auth.userId);

      const deletedPlaylistId = await this._playlistsService.delete(req.params.id, req.auth.userId);

      console.log('Delete playlist success, returning response');

      return res.status(200).json({
        status: 'success',
        message: 'Playlist berhasil dihapus',
        data: { deletedPlaylistId },
      });
    } catch (e) {
      console.error('ERROR in deletePlaylist handler:', e.message);
      console.error('Error name:', e.name);
      console.error('Error stack:', e.stack);

      // PERBAIKAN: Handle error dengan lebih spesifik
      if (e instanceof NotFoundError) {
        return res.status(404).json({
          status: 'fail',
          message: e.message,
        });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({
          status: 'fail',
          message: e.message,
        });
      }

      if (e instanceof InvariantError) {
        return res.status(400).json({
          status: 'fail',
          message: e.message,
        });
      }

      if (e instanceof ClientError) {
        return res.status(400).json({
          status: 'fail',
          message: e.message,
        });
      }

      // Error server unexpected
      console.error('Unexpected server error in deletePlaylist:', e);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server saat menghapus playlist',
      });
    }
  }

  // Fungsi untuk menghapus lagu dari playlist - PERBAIKAN
  async deleteSong(req, res) {
    try {
      console.log('=== DELETE SONG HANDLER DEBUG ===');
      console.log('Playlist ID:', req.params.id);
      console.log('Request Body:', req.body);
      console.log('User ID:', req.auth.userId);

      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid payload: Body harus berupa object JSON',
        });
      }

      // Validasi payload dengan Joi
      validateSongPayload(req.body);

      const { songId } = req.body;

      console.log('Calling service deleteSong with:', {
        playlistId: req.params.id,
        songId,
        userId: req.auth.userId,
      });

      const deletedSongId = await this._playlistsService.deleteSong(
        req.params.id,
        songId,
        req.auth.userId
      );

      console.log('Delete song success, returning response');

      return res.status(200).json({
        status: 'success',
        message: 'Lagu berhasil dihapus dari playlist',
        data: { deletedSongId },
      });
    } catch (e) {
      console.error('ERROR in deleteSong handler:', e.message);
      console.error('Error name:', e.name);
      console.error('Error stack:', e.stack);

      // PERBAIKAN: Handle error dengan lebih spesifik
      if (e instanceof NotFoundError) {
        return res.status(404).json({
          status: 'fail',
          message: e.message,
        });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({
          status: 'fail',
          message: e.message,
        });
      }

      if (e instanceof InvariantError) {
        return res.status(400).json({
          status: 'fail',
          message: e.message,
        });
      }

      if (e instanceof ClientError) {
        return res.status(400).json({
          status: 'fail',
          message: e.message,
        });
      }

      // Error server unexpected
      console.error('Unexpected server error in deleteSong:', e);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server saat menghapus lagu dari playlist',
      });
    }
  }

  // Fungsi untuk mengambil lagu dari playlist - PERBAIKAN
  async getSongs(req, res) {
    try {
      console.log('=== GET SONGS DEBUG ===');
      console.log('Playlist ID:', req.params.id);
      console.log('User ID:', req.auth.userId);

      const result = await this._playlistsService.getSongs(req.params.id, req.auth.userId);

      return res.status(200).json({
        status: 'success',
        data: result.data,
      });
    } catch (e) {
      console.error('Error in getSongs handler:', e.message);
      console.error('Error stack:', e.stack);

      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }

  // Fungsi untuk mengambil aktivitas playlist
  async getActivities(req, res) {
    try {
      console.log('=== GET ACTIVITIES DEBUG ===');
      console.log('Playlist ID:', req.params.id);
      console.log('User ID:', req.auth.userId);

      const activities = await this._playlistsService.getActivities(req.params.id, req.auth.userId);

      return res.status(200).json({
        status: 'success',
        data: {
          playlistId: req.params.id,
          activities,
        },
      });
    } catch (e) {
      console.error('Error in getActivities:', e.message);

      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }

  // Fungsi untuk mengekspor playlist - PERBAIKAN
  async postExportPlaylist(req, res) {
    try {
      console.log('=== EXPORT PLAYLIST DEBUG ===');
      console.log('Playlist ID:', req.params.id);
      console.log('User ID:', req.auth.userId);
      console.log('Request Body:', req.body);

      const playlistId = req.params.id;
      const userId = req.auth;
      const { targetEmail } = req.body;

      const result = await this._playlistsService.exportPlaylist(playlistId, userId, targetEmail);

      return res.status(201).json({
        status: 'success',
        message: result.message,
      });
    } catch (e) {
      console.error('Error in postExportPlaylist:', e.message);

      if (e instanceof NotFoundError) {
        return res.status(404).json({ status: 'fail', message: e.message });
      }

      if (e instanceof AuthorizationError) {
        return res.status(403).json({ status: 'fail', message: e.message });
      }

      if (e instanceof InvariantError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      if (e instanceof ClientError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }
}

module.exports = PlaylistsHandler;
