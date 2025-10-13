require('dotenv').config();
const express = require('express');

// Users
const UsersHandler = require('./app/api/users/handler');
const createUsersRouter = require('./app/api/users/routes');

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

// Playlists
const PlaylistsService = require('./app/services/PlaylistsService');
const playlistsValidator = require('./app/api/playlists/validator');
const PlaylistsHandler = require('./app/api/playlists/handler');
const createPlaylistsRouter = require('./app/api/playlists/routes');

// Inisialisasi express
const app = express();
app.use(express.json());

// Inisialisasi service
const albumsService = new AlbumsService();
const songsService = new SongsService();
const playlistsService = new PlaylistsService();

// Inisialisasi handler
const albumsHandler = new AlbumsHandler(albumsService, albumValidator, songsService);
const songsHandler = new SongsHandler(songsService, songValidator);
const playlistsHandler = new PlaylistsHandler(playlistsService, playlistsValidator);
const usersHandler = new UsersHandler();

// Inisialisasi router dan hubungkan dengan handler yang sesuai
const albumsRouter = createAlbumsRouter(albumsHandler);
const songsRouter = createSongsRouter(songsHandler);
const usersRouter = createUsersRouter(usersHandler);
const playlistsRouter = createPlaylistsRouter(playlistsHandler);

// Gunakan router
app.use('/albums', albumsRouter);
app.use('/songs', songsRouter);
app.use('/users', usersRouter);
app.use('/playlists', playlistsRouter);

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan pada port ${PORT}`);
});

module.exports = app;
