require('dotenv').config();
const express = require('express');

// Albums
const AlbumsService = require('./app/services/AlbumsService');
const albumValidator = require('./app/api/albums/validator');
const AlbumsHandler = require('./app/api/albums/handler');
const createAlbumsRouter = require('./app/api/albums/routes');

// Songs
const SongsService = require('./app/services/SongsService');
const songValidator = require('./app/api/songs/validator');
const SongsHandler = require('./app/api/songs/handler');
const createSongsRouter = require('./app/api/songs/routes');

// Inisialisasi express
const app = express();
app.use(express.json());

// Inisialisasi service
const albumsService = new AlbumsService();
const songsService = new SongsService();

// Inisialisasi handler
const albumsHandler = new AlbumsHandler(albumsService, albumValidator, songsService);
const albumsRouter = createAlbumsRouter(albumsHandler);

const songsHandler = new SongsHandler(songsService, songValidator);
const songsRouter = createSongsRouter(songsHandler);

// Gunakan router
app.use('/albums', albumsRouter);
app.use('/songs', songsRouter);

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan pada port ${PORT}`);
});
