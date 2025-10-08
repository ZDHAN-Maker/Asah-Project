const { nanoid } = require("nanoid");
const ClientError = require("../../utils/error/ClientError");

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
        status: "success",
        message: "Lagu berhasil ditambahkan",
        data: { songId: id },
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: "fail",
          message: error.message,
        });
      }

      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  }

  // GET /songs
  async getSongsHandler(req, res) {
    try {
      const songs = await this._service.getSongs(req.query);
      return res.status(200).json({
        status: "success",
        data: { songs },
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: "fail",
          message: error.message,
        });
      }

      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengambil data lagu",
      });
    }
  }

  // ✅ Perbaiki postSongHandler
  async postSongHandler(req, res) {
    try {
      this._validator.validateSong(req.body);

      const { title, year, performer, genre, duration, albumId } = req.body;
      const songId = await this._service.addSong({
        title,
        year,
        performer,
        genre,
        duration,
        albumId,
      });

      return res.status(201).json({
        status: "success",
        message: "Lagu berhasil ditambahkan",
        data: { songId },
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: "fail",
          message: error.message,
        });
      }

      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
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
        status: "success",
        message: "Lagu berhasil diperbarui",
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: "fail",
          message: error.message,
        });
      }

      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  }

  // DELETE /songs/:id
  async deleteSongByIdHandler(req, res) {
    try {
      const { id } = req.params;
      await this._service.deleteSongById(id);

      return res.json({
        status: "success",
        message: "Lagu berhasil dihapus",
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: "fail",
          message: error.message,
        });
      }

      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  }
}

module.exports = SongsHandler;
