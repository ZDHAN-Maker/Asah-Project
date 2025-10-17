const db = require('../db/index');
const ClientError = require('../utils/error/ClientError');

class CollaboratorService {
  async addCollaborator(playlistId, userId) {
    const playlistQuery = 'SELECT * FROM playlists WHERE id = $1';
    const playlistResult = await db.query(playlistQuery, [playlistId]);
    if (playlistResult.rows.length === 0) {
      throw new ClientError('Playlist not found', 404);
    }

    const collaboratorQuery = 'SELECT * FROM collaborators WHERE playlist_id = $1 AND user_id = $2';
    const collaboratorResult = await db.query(collaboratorQuery, [playlistId, userId]);
    if (collaboratorResult.rows.length > 0) {
      throw new ClientError('User is already a collaborator', 400);
    }

    const insertQuery = `
      INSERT INTO collaborators (playlist_id, user_id, collaboration_id, date_added)
      VALUES ($1, $2, $3, $4) RETURNING collaboration_id
    `;
    const collaborationId = `collab_${Math.random().toString(36).substr(2, 9)}`;
    const insertResult = await db.query(insertQuery, [
      playlistId,
      userId,
      collaborationId,
      new Date(),
    ]);

    return insertResult.rows[0].collaboration_id;
  }

  async removeCollaborator(playlistId, userId) {
    const playlistQuery = 'SELECT * FROM playlists WHERE id = $1';
    const playlistResult = await db.query(playlistQuery, [playlistId]);
    if (playlistResult.rows.length === 0) {
      throw new ClientError('Playlist not found', 404);
    }

    const collaboratorQuery = 'SELECT * FROM collaborators WHERE playlist_id = $1 AND user_id = $2';
    const collaboratorResult = await db.query(collaboratorQuery, [playlistId, userId]);
    if (collaboratorResult.rows.length === 0) {
      throw new ClientError('User is not a collaborator', 400);
    }

    const deleteQuery = 'DELETE FROM collaborators WHERE playlist_id = $1 AND user_id = $2';
    await db.query(deleteQuery, [playlistId, userId]);

    return true;
  }
}

module.exports = CollaboratorService;
