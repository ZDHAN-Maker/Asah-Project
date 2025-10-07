require('dotenv').config();
const express = require('express');

const AlbumsService = require('./app/services/AlbumsService');
const SongsService = require('./app/services/SongsService');

const albumValidator = require('./app/api/albums/validator');
// const songValidator = require('./app/api/songs/validator'); // belum dipakai

const AlbumsServiceInstance = new AlbumsService();
const SongsServiceInstance = new SongsService();

const app = express();
app.use(express.json());

// Tambah album
app.post('/albums', async (req, res) => {
  try {
    albumValidator(req.body);
    const albumId = await AlbumsServiceInstance.addAlbum(req.body);
    return res.status(201).json({ status: 'success', data: { albumId } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
});

// Ambil album by ID
app.get('/albums/:id', async (req, res) => {
  try {
    const album = await AlbumsServiceInstance.getAlbumById(req.params.id);
    const songs = await SongsServiceInstance.getSongsByAlbumId(req.params.id);
    album.songs = songs;
    return res.json({ status: 'success', data: { album } });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ status: 'fail', message: error.message });
    }
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
});

// Ambil semua songs (dengan query filter optional)
app.get('/songs', async (req, res) => {
  try {
    const { title, performer } = req.query;
    const songs = await SongsServiceInstance.getSongs({ title, performer });
    return res.json({ status: 'success', data: { songs } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Express server running on port ${PORT}`));
