const { nanoid } = require('nanoid');
const InvariantError = require('../../utils/error/InvariantError');

class SongsHandler {
  constructor(songsService, validator) {
    this._service = songsService;
    this._validator = validator;
  }

  // POST /songs
  async postSongHandler(req, res) {
    try {
      this._validator.validateSong(req.body);

      const { title, year, performer, genre, duration, albumId } = req.body;
      const id = nanoid(16);
      const createdAt = new Date().toISOString();
      const updatedAt = createdAt;

      const newSong = {
        id,
        title,
        year,
        performer,
        genre,
        duration,
        albumId,
        createdAt,
        updatedAt,
      };

      await this._service.addSong(newSong);

      return res.status(201).json({
        status: 'success',
        message: 'Lagu berhasil ditambahkan',
        data: { songId: id },
      });
    } catch (error) {
      if (error instanceof InvariantError) {
        return res.status(400).json({
          status: 'fail',
          message: error.message,
        });
      }

      console.error(error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }

  // GET /songs
  async getSongsHandler(req, res) {
    try {
      const songs = await this._service.getSongs();
      return res.json({
        status: 'success',
        data: { songs },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data lagu',
      });
    }
  }

  // GET /songs/:id
  async getSongByIdHandler(req, res) {
    try {
      const { id } = req.params;
      const song = await this._service.getSongById(id);

      if (!song) {
        return res.status(404).json({
          status: 'fail',
          message: 'Lagu tidak ditemukan',
        });
      }

      return res.json({
        status: 'success',
        data: { song },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }

  // PUT /songs/:id
  async putSongByIdHandler(req, res) {
    try {
      this._validator.validateSong(req.body);
      const { id } = req.params;

      await this._service.updateSongById(id, req.body);

      return res.json({
        status: 'success',
        message: 'Lagu berhasil diperbarui',
      });
    } catch (error) {
      if (error instanceof InvariantError) {
        return res.status(400).json({
          status: 'fail',
          message: error.message,
        });
      }

      return res.status(404).json({
        status: 'fail',
        message: 'Gagal memperbarui lagu. Id tidak ditemukan',
      });
    }
  }

  // DELETE /songs/:id
  async deleteSongByIdHandler(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this._service.deleteSongById(id);

      if (!deleted) {
        return res.status(404).json({
          status: 'fail',
          message: 'Lagu gagal dihapus. Id tidak ditemukan',
        });
      }

      return res.json({
        status: 'success',
        message: 'Lagu berhasil dihapus',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }
}

module.exports = SongsHandler;
