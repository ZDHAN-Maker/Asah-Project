require('dotenv').config();
const express = require('express');
const path = require('path');

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
const PlaylistsService = require('./app/services/PlayListsService');
const playlistsValidator = require('./app/api/playlists/validator');
const PlaylistsHandler = require('./app/api/playlists/handler');
const createPlaylistsRouter = require('./app/api/playlists/routes');

// Collaborations
const CollaborationsService = require('./app/services/collaborationsService');
const validateCollaborator = require('./app/api/collaborations/validator');
const CollaboratorHandler = require('./app/api/collaborations/handler');
const createCollaboratorRoute = require('./app/api/collaborations/routes');

// Inisialisasi express

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Inisialisasi service
const collaborationsService = new CollaborationsService();
const playlistsService = new PlaylistsService(collaborationsService);
collaborationsService._playlistService = playlistsService;

const albumsService = new AlbumsService();
const songsService = new SongsService();

// Inisialisasi handler
const albumsHandler = new AlbumsHandler(albumsService, albumValidator, songsService);
const songsHandler = new SongsHandler(songsService, songValidator);
const playlistsHandler = new PlaylistsHandler(playlistsService, playlistsValidator);
const collaboratorHandler = new CollaboratorHandler(collaborationsService, validateCollaborator);
const usersHandler = new UsersHandler();

// Inisialisasi router dan hubungkan dengan handler
const albumsRouter = createAlbumsRouter(albumsHandler);
const songsRouter = createSongsRouter(songsHandler);
const usersRouter = createUsersRouter(usersHandler);
const playlistsRouter = createPlaylistsRouter(playlistsHandler);
const collaborationsRouter = createCollaboratorRoute(collaboratorHandler);

// Gunakan router
app.use('/albums', albumsRouter);
app.use('/songs', songsRouter);
app.use('/users', usersRouter);
app.use('/', usersRouter);
app.use('/', playlistsRouter);
app.use('/collaborations', collaborationsRouter);

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server berjalan pada port ${PORT}`);
});

// Mulai consumer untuk ekspor playlist
try {
  playlistsService.listenForPlaylistExportRequests();
} catch (e) {
  console.warn('Failed to start playlist export consumer:', e.message);
}
module.exports = app;
