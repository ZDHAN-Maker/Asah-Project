const { nanoid } = require('nanoid');
const ClientError = require('../../utils/error/ClientError');

class SongsHandler {
  constructor(songsService, validator) {
    this._service = songsService;
    this._validator = validator;
  }

  async postSongHandler(req, res) {
    try {
      this._validator.validateSong(req.body);

      const { title, year, performer, genre, duration, albumId } = req.body;
      const id = `song-${nanoid(16)}`;
      const timestamp = new Date().toISOString();

      const newSong = {
        id,
        title,
        year,
        performer,
        genre,
        duration,
        albumId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await this._service.addSong(newSong);

      return res.status(201).json({
        status: 'success',
        message: 'Lagu berhasil ditambahkan',
        data: {
          songId: id,
        },
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: 'fail',
          message: error.message,
        });
      }

      console.error('postSongHandler Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }

  async getSongsHandler(req, res) {
    try {
      const songs = await this._service.getSongs(req.query);

      const simplifiedSongs = songs.map((song) => ({
        id: song.id,
        title: song.title,
        performer: song.performer,
      }));

      return res.status(200).json({
        status: 'success',
        data: { songs: simplifiedSongs },
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: 'fail',
          message: error.message,
        });
      }

      console.error('getSongsHandler Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data lagu',
      });
    }
  }

  async getSongByIdHandler(req, res) {
    try {
      const { id } = req.params;
      const song = await this._service.getSongById(id);

      const responseSong = {
        id: song.id,
        title: song.title,
        year: song.year,
        performer: song.performer,
        genre: song.genre || null,
        duration: song.duration || null,
        albumId: song.albumId || null,
      };

      return res.status(200).json({
        status: 'success',
        data: { song: responseSong },
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: 'fail',
          message: error.message,
        });
      }

      console.error('getSongByIdHandler Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }

  async putSongByIdHandler(req, res) {
    try {
      this._validator.validateSong(req.body);
      const { id } = req.params;

      await this._service.updateSongById(id, req.body);

      return res.status(200).json({
        status: 'success',
        message: 'Lagu berhasil diperbarui',
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: 'fail',
          message: error.message,
        });
      }

      console.error('putSongByIdHandler Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }

  async deleteSongByIdHandler(req, res) {
    try {
      const { id } = req.params;
      await this._service.deleteSongById(id);

      return res.status(200).json({
        status: 'success',
        message: 'Lagu berhasil dihapus',
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: 'fail',
          message: error.message,
        });
      }

      console.error('deleteSongByIdHandler Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
    }
  }
}

module.exports = SongsHandler;
