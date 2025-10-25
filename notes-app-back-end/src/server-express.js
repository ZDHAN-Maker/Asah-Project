require('dotenv').config();
const express = require('express');
const path = require('path');

// === USERS ===
const UsersHandler = require('./app/api/users/handler');
const createUsersRouter = require('./app/api/users/routes');

// === ALBUMS ===
const AlbumsService = require('./app/services/AlbumsService');
const albumValidator = require('./app/api/albums/validator');
const AlbumsHandler = require('./app/api/albums/handler');
const createAlbumsRouter = require('./app/api/albums/routes');

// === SONGS ===
const SongsService = require('./app/services/SongsService');
const songValidator = require('./app/api/songs/validator');
const SongsHandler = require('./app/api/songs/handler');
const createSongsRouter = require('./app/api/songs/routes');

// === PLAYLISTS ===
const PlaylistsService = require('./app/services/PlayListsService');
const playlistsValidator = require('./app/api/playlists/validator');
const PlaylistsHandler = require('./app/api/playlists/handler');
const createPlaylistsRouter = require('./app/api/playlists/routes');

// === COLLABORATIONS ===
const CollaborationsService = require('./app/services/collaborationsService');
const validateCollaborator = require('./app/api/collaborations/validator');
const CollaboratorHandler = require('./app/api/collaborations/handler');
const createCollaboratorRoute = require('./app/api/collaborations/routes');

// === APP INIT ===
const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === SERVICE INIT ===
const collaborationsService = new CollaborationsService();
const playlistsService = new PlaylistsService(collaborationsService);

// Menyambungkan service agar kolaborasi bisa akses playlist
collaborationsService._playlistService = playlistsService;

const albumsService = new AlbumsService();
const songsService = new SongsService();

// === HANDLER INIT ===
const usersHandler = new UsersHandler();
const albumsHandler = new AlbumsHandler(albumsService, albumValidator, songsService);
const songsHandler = new SongsHandler(songsService, songValidator);
const playlistsHandler = new PlaylistsHandler(playlistsService, playlistsValidator);
const collaboratorHandler = new CollaboratorHandler(collaborationsService, validateCollaborator);

// === ROUTER INIT ===
app.use('/users', createUsersRouter(usersHandler));
app.use('/', createUsersRouter(usersHandler));
app.use('/albums', createAlbumsRouter(albumsHandler));
app.use('/songs', createSongsRouter(songsHandler));
app.use('/playlists', createPlaylistsRouter(playlistsHandler));
app.use('/collaborations', createCollaboratorRoute(collaboratorHandler));

// === SERVER START ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan pada port ${PORT}`);
});

// === QUEUE CONSUMER (playlist export) ===
try {
  playlistsService.listenForPlaylistExportRequests();
} catch (err) {
  console.warn('Gagal memulai playlist export consumer:', err.message);
}

module.exports = app;
