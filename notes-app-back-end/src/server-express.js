require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const AlbumsService = require('./app/services/AlbumsService');
const SongsService = require('./app/services/SongsService');

const albumValidator = require('./app/api/albums/validator');
const songValidator = require('./app/api/songs/validator');

const AlbumsServiceInstance = new AlbumsService();
const SongsServiceInstance = new SongsService();

const app = express();
app.use(bodyParser.json());

// Albums routes (Express)
app.post('/albums', async (req, res) => {
  try {
    albumValidator(req.body);
    const albumId = await AlbumsServiceInstance.addAlbum(req.body);
    res.status(201).json({ status: 'success', data: { albumId } });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ status: 'fail', message: error.message });
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
});

app.get('/albums/:id', async (req, res) => {
  try {
    const album = await AlbumsServiceInstance.getAlbumById(req.params.id);
    // optional: include songs
    const songs = await SongsServiceInstance.getSongsByAlbumId(req.params.id);
    album.songs = songs;
    res.json({ status: 'success', data: { album } });
  } catch (error) {
    if (error.name === 'NotFoundError') return res.status(404).json({ status: 'fail', message: error.message });
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
});

// Songs routes with query params support
app.get('/songs', async (req, res) => {
  try {
    const { title, performer } = req.query;
    const songs = await SongsServiceInstance.getSongs({ title, performer });
    res.json({ status: 'success', data: { songs } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Express running on ${PORT}`));
