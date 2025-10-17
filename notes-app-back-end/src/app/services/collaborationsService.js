class CollaboratorService {
  constructor(database) {
    this._database = database;
  }

  async addCollaborator(playlistId, userId) {
    const playlistExists = await this._database.findPlaylistById(playlistId);
    if (!playlistExists) {
      throw new Error('Playlist not found');
    }

    const existingCollaborator = await this._database.findCollaborator(playlistId, userId);
    if (existingCollaborator) {
      throw new Error('User is already a collaborator');
    }

    const collaborationId = this._generateCollaborationId();
    const collaboration = {
      playlistId,
      userId,
      collaborationId,
      dateAdded: new Date(),
    };

    await this._database.addCollaborator(collaboration);

    return collaborationId;
  }

  async removeCollaborator(playlistId, userId) {
    const playlistExists = await this._database.findPlaylistById(playlistId);
    if (!playlistExists) {
      throw new Error('Playlist not found');
    }

    const existingCollaborator = await this._database.findCollaborator(playlistId, userId);
    if (!existingCollaborator) {
      throw new Error('User is not a collaborator');
    }

    await this._database.removeCollaborator(playlistId, userId);

    return true;
  }

  _generateCollaborationId() {
    return `collab_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = CollaboratorService;
