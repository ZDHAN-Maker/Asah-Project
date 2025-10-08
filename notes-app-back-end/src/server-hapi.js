require('dotenv').config();
const Hapi = require('@hapi/hapi');

// --- Import Services
const AlbumsService = require('./app/services/AlbumsService');
const SongsService = require('./app/services/SongsService');

// --- Import Routes, Handlers, dan Validators
const createAlbumsRoutes = require('./app/api/albums/routes');
const AlbumsHandler = require('./app/api/albums/handler');
const albumValidator = require('./app/api/albums/validator');

const createSongsRoutes = require('./app/api/songs/routes');
const SongsHandler = require('./app/api/songs/handler');
const songValidator = require('./app/api/songs/validator');

// --- Fungsi utama untuk inisialisasi server
const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: { origin: ['*'] },
    },
  });

  const albumsService = new AlbumsService();
  const songsService = new SongsService();

  const albumsHandler = new AlbumsHandler(albumsService, albumValidator, songsService);
  const songsHandler = new SongsHandler(songsService, songValidator);

  const albumsRoutes = createAlbumsRoutes(albumsHandler);
  const songsRoutes = createSongsRoutes(songsHandler);

  server.route(albumsRoutes);
  server.route(songsRoutes);

  await server.start();
  console.log(`Server Hapi berjalan di ${server.info.uri}`);
};

init().catch((err) => {
  console.error('Gagal menjalankan server Hapi:', err);
  process.exit(1);
});
