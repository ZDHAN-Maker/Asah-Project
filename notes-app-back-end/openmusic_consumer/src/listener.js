class Listener {
  constructor(playlistsService, mailSender) {
    this._playlistsService = playlistsService;
    this._mailSender = mailSender;

    this.listen = this.listen.bind(this);
  }

  async listen(message) {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());

      // ambil data playlist dari service
      const playlist = await this._playlistsService.getPlaylistById(playlistId);

      // susun struktur JSON sesuai ketentuan
      const playlistData = {
        playlist: {
          id: playlist.id,
          name: playlist.name,
          songs: playlist.songs.map((song) => ({
            id: song.id,
            title: song.title,
            performer: song.performer,
          })),
        },
      };

      // kirim email hasil export
      const result = await this._mailSender.sendEmail(
        targetEmail,
        JSON.stringify(playlistData)
      );

      console.log('Email sent:', result);
    } catch (error) {
      console.error('Listener error:', error);
    }
  }
}

module.exports = Listener;
