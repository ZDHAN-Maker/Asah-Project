require('dotenv').config();
const Hapi = require('@hapi/hapi');

const AlbumsService = require('./app/services/AlbumsService');
const SongsService = require('./app/services/SongsService');

const albums = require('./app/api/albums/routes');
const AlbumsHandler = require('./app/api/albums/handler');
const albumValidator = require('./app/api/albums/validator');

const songs = require('./app/api/songs/routes');
const SongsHandler = require('./app/api/songs/handler');
const songValidator = require('./app/api/songs/validator');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: 'localhost',
    routes: { cors: { origin: ['*'] } },
  });

  const albumsService = new AlbumsService();
  const songsService = new SongsService();

  const albumsHandler = new AlbumsHandler(albumsService, albumValidator, songsService);
  const songsHandler = new SongsHandler(songsService, songValidator);

  server.route(albums(albumsHandler));
  server.route(songs(songsHandler));

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

init();
