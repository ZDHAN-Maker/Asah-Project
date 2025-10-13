const ClientError = require('../../utils/error/ClientError');
const PlaylistsService = require('../../services/PlayListsService');
const { validateCreate, validateSongPayload } = require('./validator');

class PlaylistsHandler {
  // POST /playlists
  async postPlaylist(req, res) {
    try {
      validateCreate(req.body);
      const id = await PlaylistsService.create({ name: req.body.name, owner: req.auth.userId });
      return res.status(201).json({ status: 'success', data: { playlistId: id } });
    } catch (e) {
      if (e instanceof ClientError) return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // GET /playlists
  async getPlaylists(req, res) {
    try {
      const playlists = await PlaylistsService.getForUser(req.auth.userId);
      return res.status(200).json({ status: 'success', data: { playlists } });
    } catch {
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // DELETE /playlists/:id
  async deletePlaylist(req, res) {
    try {
      await PlaylistsService.delete(req.params.id, req.auth.userId);
      return res.status(200).json({ status: 'success', message: 'Playlist berhasil dihapus' });
    } catch (e) {
      if (e instanceof ClientError) return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // POST/GET/DELETE /playlists/:id/songs
  async postSong(req, res) {
    try {
      validateSongPayload(req.body);
      await PlaylistsService.addSong(req.params.id, req.body.songId, req.auth.userId);
      return res.status(201).json({ status: 'success', message: 'Lagu berhasil ditambahkan ke playlist' });
    } catch (e) {
      if (e instanceof ClientError) return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  async getSongs(req, res) {
    try {
      const songs = await PlaylistsService.getSongs(req.params.id, req.auth.userId);
      return res.status(200).json({ status: 'success', data: { songs } });
    } catch (e) {
      if (e instanceof ClientError) return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  async deleteSong(req, res) {
    try {
      validateSongPayload(req.body);
      await PlaylistsService.deleteSong(req.params.id, req.body.songId, req.auth.userId);
      return res.status(200).json({ status: 'success', message: 'Lagu berhasil dihapus dari playlist' });
    } catch (e) {
      if (e instanceof ClientError) return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // [opsional] GET /playlists/:id/activities
  async getActivities(req, res) {
    try {
      const activities = await PlaylistsService.getActivities(req.params.id, req.auth.userId);
      return res.status(200).json({ status: 'success', data: { activities } });
    } catch (e) {
      if (e instanceof ClientError) return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }
}
module.exports = PlaylistsHandler;
