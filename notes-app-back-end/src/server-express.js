require('dotenv').config();
const express = require('express');

const AlbumsService = require('./app/services/AlbumsService');
const albumValidator = require('./app/api/albums/validator');
const AlbumsHandler = require('./app/api/albums/handler');
const createAlbumsRouter = require('./app/api/albums/routes');

// Inisialisasi service dan handler
const albumsService = new AlbumsService();
const albumsHandler = new AlbumsHandler(albumsService, albumValidator);
const albumsRouter = createAlbumsRouter(albumsHandler);

// Inisialisasi express
const app = express();
app.use(express.json());

// Gunakan router albums
app.use('/albums', albumsRouter);

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan pada port ${PORT}`);
});
