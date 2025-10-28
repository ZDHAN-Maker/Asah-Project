const { Pool } = require("pg");

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }
  
  async getPlaylistById(playlistId) {
    const playlistQuery = {
      text: `
        SELECT p.id, p.name, u.username
        FROM playlists p
        JOIN users u ON u.id = p.owner
        WHERE p.id = $1
      `,
      values: [playlistId],
    };

    const playlistResult = await this._pool.query(playlistQuery);
    if (!playlistResult.rowCount) {
      throw new Error("Playlist tidak ditemukan");
    }

    const songsQuery = {
      text: `
        SELECT s.id, s.title, s.performer
        FROM playlist_songs ps
        JOIN songs s ON s.id = ps.song_id
        WHERE ps.playlist_id = $1
      `,
      values: [playlistId],
    };

    const songsResult = await this._pool.query(songsQuery);

    return {
      id: playlistResult.rows[0].id,
      name: playlistResult.rows[0].name,
      username: playlistResult.rows[0].username,
      songs: songsResult.rows,
    };
  }
}

module.exports = PlaylistsService;
