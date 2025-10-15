const ClientError = require('../../utils/error/ClientError');
const PlaylistsService = require('../../services/PlayListsService'); // Mengimpor PlaylistsService
const InvariantError = require('../../utils/error/InvariantError');
const NotFoundError = require('../../utils/error/NotFoundError');
const { validateCreate, validateSongPayload } = require('./validator');

class PlaylistsHandler {
  // Membuat instance PlaylistsService
  constructor() {
    this.playlistsService = new PlaylistsService();
  }

  // POST /playlists
  async postPlaylist(req, res) {
    try {
      // Validasi input yang dikirim
      validateCreate(req.body);

      // Coba buat playlist dan dapatkan ID
      const id = await this.playlistsService.create({
        name: req.body.name,
        owner: req.auth.userId,
      });

      // Jika berhasil, kembalikan response status 201
      return res.status(201).json({ status: 'success', data: { playlistId: id } });
    } catch (e) {
      // Menangani InvariantError (validasi)
      if (e instanceof InvariantError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      // Jika error adalah ClientError, kembalikan status 400
      if (e instanceof ClientError) {
        return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      }

      // Jika ada error lainnya (misalnya, error server), kembalikan status 500
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
      // Menangani error jika terjadi
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
      const { title, year, performer, genre, duration, albumId } = req.body;
      const { id: playlistId } = req.params; // Destructuring playlistId dari req.params
      const { userId } = req.auth; // Destructuring userId dari req.auth

      // Validasi payload lagu
      validateSongPayload(req.body);

      // Menambahkan lagu dan menghubungkannya dengan playlist
      const songId = await this.playlistsService.addSong({
        title,
        year,
        performer,
        genre,
        duration,
        albumId,
        playlistId,
        userId, // Pass userId untuk pengecekan izin
      });

      // Mengirimkan respon sukses
      return res.status(201).json({
        status: 'success',
        message: 'Lagu berhasil ditambahkan ke playlist',
        data: { songId },
      });
    } catch (e) {
      if (e instanceof NotFoundError) {
        // Menangani error jika lagu tidak ditemukan (status 404)
        return res.status(404).json({ status: 'fail', message: e.message });
      }

      if (e instanceof InvariantError) {
        return res.status(400).json({ status: 'fail', message: e.message });
      }

      if (e instanceof ClientError) {
        return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      }

      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  async getSongs(req, res) {
    try {
      const songs = await this.playlistsService.getSongs(req.params.id, req.auth.userId);
      return res.status(200).json({ status: 'success', data: { songs } });
    } catch (e) {
      if (e instanceof ClientError) {
        return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      }
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
